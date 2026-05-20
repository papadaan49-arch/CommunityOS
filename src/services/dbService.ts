import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
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

export const trackOrganizationGrowth = async (orgName: string, data: EventData) => {
  if (!orgName) return;
  
  const orgId = orgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const orgRef = doc(db, 'organizations', orgId);

  try {
    const orgSnap = await getDoc(orgRef);
    const userId = auth.currentUser?.uid;

    if (orgSnap.exists()) {
      const current = orgSnap.data();
      const updatedTypes = { ...current.eventTypes };
      updatedTypes[data.type] = (updatedTypes[data.type] || 0) + 1;

      await updateDoc(orgRef, {
        totalEvents: current.totalEvents + 1,
        totalParticipants: current.totalParticipants + data.participants,
        totalBudget: current.totalBudget + data.budget,
        eventTypes: updatedTypes,
        locations: arrayUnion(data.location),
        creatorIds: arrayUnion(userId),
        lastActive: serverTimestamp()
      });
    } else {
      await import('firebase/firestore').then(async ({ setDoc }) => {
        await setDoc(orgRef, {
          name: orgName,
          totalEvents: 1,
          totalParticipants: data.participants,
          totalBudget: data.budget,
          eventTypes: { [data.type]: 1 },
          locations: [data.location],
          creatorIds: userId ? [userId] : [],
          lastActive: serverTimestamp()
        });
      });
    }
  } catch (error) {
    console.error("Failed to track organization growth:", error);
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Track growth
    await trackOrganizationGrowth(originalData.organization, originalData);

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
    const q = query(collection(db, 'organizations'), where('creatorIds', 'array-contains', auth.currentUser.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as OrganizationProfile));
  } catch (error) {
    console.error("Failed to fetch org profiles:", error);
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
