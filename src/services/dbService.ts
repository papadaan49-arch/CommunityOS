import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Blueprint, EventData } from '../types';

export interface BlueprintDocument {
  id: string;
  data: Blueprint;
  originalData: EventData;
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
  realizationStatus?: 'draft' | 'ready' | 'realized';
  realizationDetails?: any;
  rundownChecklist?: Record<string, boolean>;
  rundownNotes?: Record<string, string>;
}

export interface BlueprintComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  totalEvents: number;
  totalParticipants: number;
  totalBudget: number;
  eventTypes: Record<string, number>;
  locations: string[];
  lastActive: any;
  creatorIds: string[];
}

export const recalculateAndSyncOrganizationStats = async () => {
  if (!auth.currentUser) {
    console.warn("Mencoba sinkronisasi statistik tanpa login. Operasi dibatalkan.");
    return false;
  }
  try {
    // 1. Fetch all blueprints
    const blueprintsSnap = await getDocs(collection(db, 'blueprints'));
    const blueprints: BlueprintDocument[] = [];
    blueprintsSnap.forEach((doc) => {
      blueprints.push({ id: doc.id, ...doc.data() } as BlueprintDocument);
    });

    // 2. Filter purely for realizationStatus === 'realized'
    const realizedBlueprints = blueprints.filter(b => b.realizationStatus === 'realized');

    // 3. Group and aggregate stats from realized events
    const orgAggregates: Record<string, {
      name: string;
      totalEvents: number;
      totalParticipants: number;
      totalBudget: number;
      eventTypes: Record<string, number>;
      locations: Set<string>;
      creatorIds: Set<string>;
    }> = {};

    for (const bp of realizedBlueprints) {
      const orgName = bp.originalData?.organization;
      if (!orgName) continue;

      const orgId = orgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!orgId) continue;

      if (!orgAggregates[orgId]) {
        orgAggregates[orgId] = {
          name: orgName,
          totalEvents: 0,
          totalParticipants: 0,
          totalBudget: 0,
          eventTypes: {},
          locations: new Set<string>(),
          creatorIds: new Set<string>(),
        };
      }

      const agg = orgAggregates[orgId];
      agg.totalEvents += 1;

      // Purely rill actual feedback/participants if inputted by user, otherwise fallback to estimates safely
      const actualPart = bp.realizationDetails?.actualParticipants !== undefined 
        ? Number(bp.realizationDetails.actualParticipants) 
        : Number(bp.originalData?.participants || 0);
      agg.totalParticipants += actualPart;

      agg.totalBudget += Number(bp.originalData?.budget || 0);

      const type = bp.originalData?.type || 'Lainnya';
      agg.eventTypes[type] = (agg.eventTypes[type] || 0) + 1;

      if (bp.originalData?.location) {
        agg.locations.add(bp.originalData.location);
      }
      if (bp.ownerId) {
        agg.creatorIds.add(bp.ownerId);
      }
      if (bp.collaborators) {
        bp.collaborators.forEach(c => agg.creatorIds.add(c));
      }
    }

    // 4. Overwrite/Sync database collections
    const orgsSnap = await getDocs(collection(db, 'organizations'));
    const existingOrgIds = orgsSnap.docs.map(d => d.id);

    // Save accurate, aggregated datasets
    for (const [orgId, agg] of Object.entries(orgAggregates)) {
      const orgRef = doc(db, 'organizations', orgId);
      await setDoc(orgRef, {
        name: agg.name,
        totalEvents: agg.totalEvents,
        totalParticipants: agg.totalParticipants,
        totalBudget: agg.totalBudget,
        eventTypes: agg.eventTypes,
        locations: Array.from(agg.locations),
        creatorIds: Array.from(agg.creatorIds),
        lastActive: serverTimestamp()
      });
    }

    // Delete orphaned or outdated empty organizations in database
    const activeOrgIds = Object.keys(orgAggregates);
    for (const existingId of existingOrgIds) {
      if (!activeOrgIds.includes(existingId)) {
        const orgRef = doc(db, 'organizations', existingId);
        await deleteDoc(orgRef);
      }
    }

    console.log("Database self-healing & statistics sync complete!");
    return true;
  } catch (error) {
    console.error("Gagal melakukan pencocokan statistik organisasi:", error);
    return false;
  }
};

export const saveBlueprintToCloud = async (data: Blueprint, originalData: EventData) => {
  if (!auth.currentUser) return null;

  try {
    const docRef = await addDoc(collection(db, 'blueprints'), {
      data,
      originalData,
      ownerId: auth.currentUser.uid,
      collaborators: [],
      isPublic: false,
      realizationStatus: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'blueprints');
    return null;
  }
};

export const updateBlueprintInCloud = async (blueprintId: string, data: Blueprint, originalData: EventData) => {
  try {
    const docRef = doc(db, 'blueprints', blueprintId);
    await updateDoc(docRef, {
      data,
      originalData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blueprints/${blueprintId}`);
  }
};

export const updateBlueprintRealizationStatus = async (
  blueprintId: string, 
  status: 'draft' | 'ready' | 'realized', 
  details?: {
    actualParticipants?: number;
    actualStaff?: number;
    actualComplexityScore?: number;
    fieldNotes?: string;
    completedAt?: any;
  },
  originalData?: EventData
) => {
  try {
    const docRef = doc(db, 'blueprints', blueprintId);
    const updatePayload: any = {
      realizationStatus: status,
      updatedAt: serverTimestamp(),
    };
    if (details) {
      updatePayload.realizationDetails = details;
    } else if (status === 'draft') {
      // Clear realization details if moved back to draft or edit
      const { deleteField } = await import('firebase/firestore');
      updatePayload.realizationDetails = deleteField();
    }
    await updateDoc(docRef, updatePayload);
    
    // Automatically trigger perfect self-healing dynamic statistics recalculation
    await recalculateAndSyncOrganizationStats();
    
    return true;
  } catch (error) {
    console.error("Gagal memperbarui status realisasi:", error);
    return false;
  }
};

export const getBlueprintFromCloud = async (blueprintId: string): Promise<BlueprintDocument | null> => {
  try {
    const docRef = doc(db, 'blueprints', blueprintId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BlueprintDocument;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `blueprints/${blueprintId}`);
    return null;
  }
};

export const getUserBlueprints = async (): Promise<BlueprintDocument[]> => {
  if (!auth.currentUser) return [];

  try {
    // We can't easily do an "OR" query for dynamic arrays in Firestore without complex logic
    // but we can query by owner and then filter or do a separate query.
    // For now, let's query where ownerId is current user.
    const q1 = query(collection(db, 'blueprints'), where('ownerId', '==', auth.currentUser.uid));
    const querySnapshot1 = await getDocs(q1);
    
    // Also query where user is a collaborator
    const q2 = query(collection(db, 'blueprints'), where('collaborators', 'array-contains', auth.currentUser.uid));
    const querySnapshot2 = await getDocs(q2);

    const blueprints: BlueprintDocument[] = [];
    querySnapshot1.forEach((doc) => {
      blueprints.push({ id: doc.id, ...doc.data() } as BlueprintDocument);
    });
    
    querySnapshot2.forEach((doc) => {
      if (!blueprints.find(b => b.id === doc.id)) {
        blueprints.push({ id: doc.id, ...doc.data() } as BlueprintDocument);
      }
    });

    return blueprints.sort((a, b) => b.updatedAt?.seconds - a.updatedAt?.seconds);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'blueprints');
    return [];
  }
};

export const addCollaborator = async (blueprintId: string, userEmail: string) => {
  try {
    const emailIndexRef = doc(db, 'users_by_email', userEmail);
    const emailSnap = await getDoc(emailIndexRef);
    
    if (!emailSnap.exists()) {
      throw new Error(`User with email ${userEmail} belum pernah masuk ke CommunityOS.`);
    }

    const { uid: targetUserId } = emailSnap.data();
    const docRef = doc(db, 'blueprints', blueprintId);
    
    await updateDoc(docRef, {
      collaborators: arrayUnion(targetUserId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('belum pernah masuk')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, `blueprints/${blueprintId}/collaborators`);
  }
};

export const togglePublicAccess = async (blueprintId: string, isPublic: boolean) => {
  try {
    const docRef = doc(db, 'blueprints', blueprintId);
    await updateDoc(docRef, {
      isPublic,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blueprints/${blueprintId}`);
  }
};

export const getAppSetting = async (key: string): Promise<any> => {
  try {
    const docRef = doc(db, 'settings', key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const updateAppSetting = async (key: string, value: any) => {
  try {
    const docRef = doc(db, 'settings', key);
    const { setDoc } = await import('firebase/firestore');
    await setDoc(docRef, {
      value,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `settings/${key}`);
  }
};

export const getOrgProfiles = async (): Promise<OrganizationProfile[]> => {
  if (!auth.currentUser) return [];
  try {
    // Automatically recalculate and sync accurate stats on fetching
    await recalculateAndSyncOrganizationStats();
    const q = query(collection(db, 'organizations'), where('creatorIds', 'array-contains', auth.currentUser.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as OrganizationProfile));
  } catch (error) {
    console.error("Failed to fetch org profiles:", error);
    return [];
  }
};

export const getAllOrgProfiles = async (): Promise<OrganizationProfile[]> => {
  try {
    // Automatically recalculate and sync accurate stats on fetching
    await recalculateAndSyncOrganizationStats();
    const q = query(collection(db, 'organizations'));
    const snap = await getDocs(q);
    return snap.docs.map( d => ({ id: d.id, ...d.data() } as OrganizationProfile));
  } catch (error) {
    console.error("Failed to fetch all org profiles:", error);
    return [];
  }
};

export const getUserStats = async (): Promise<{ totalBlueprints: number, totalParticipants: number }> => {
  if (!auth.currentUser) return { totalBlueprints: 0, totalParticipants: 0 };
  try {
    const q = query(collection(db, 'blueprints'), where('ownerId', '==', auth.currentUser.uid));
    const snap = await getDocs(q);
    let totalParticipants = 0;
    snap.forEach(doc => {
      totalParticipants += (doc.data().originalData?.participants || 0);
    });
    return { totalBlueprints: snap.size, totalParticipants };
  } catch (error) {
    return { totalBlueprints: 0, totalParticipants: 0 };
  }
};

export const postComment = async (blueprintId: string, text: string) => {
  if (!auth.currentUser) throw new Error("Anda harus masuk untuk memberi komentar.");

  try {
    const commentsRef = collection(db, 'blueprints', blueprintId, 'comments');
    await addDoc(commentsRef, {
      text,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || auth.currentUser.email || 'Relawan',
      authorPhoto: auth.currentUser.photoURL || '',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `blueprints/${blueprintId}/comments`);
  }
};

export const updateBlueprintRundownProgress = async (
  blueprintId: string,
  rundownChecklist: Record<string, boolean> | Record<number, boolean>,
  rundownNotes: Record<string, string> | Record<number, string>
) => {
  try {
    const docRef = doc(db, 'blueprints', blueprintId);
    
    // Konversi key integer/string agar kompatibel sempurna dengan Firestore
    const cleanChecklist: Record<string, boolean> = {};
    Object.entries(rundownChecklist).forEach(([k, v]) => {
      cleanChecklist[String(k)] = !!v;
    });

    const cleanNotes: Record<string, string> = {};
    Object.entries(rundownNotes).forEach(([k, v]) => {
      cleanNotes[String(k)] = String(v);
    });

    await updateDoc(docRef, {
      rundownChecklist: cleanChecklist,
      rundownNotes: cleanNotes,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blueprints/${blueprintId}`);
    return false;
  }
};

