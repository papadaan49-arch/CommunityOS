import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp, 
  arrayUnion
} from 'firebase/firestore';
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

// Default Settings dictionary
const DEFAULT_SETTINGS: Record<string, any> = {
  community_broadcast: "Selamat Datang di Hub Mandiri CommunityOS! Mode Gerilya 100% Aktif secara Lokal. Selamat mengorganisir gerakan sosial Anda 🎉",
  app_version: "v1.2.0-Offline"
};

// --- Local Storage Helpers (Offline-First Engine) ---

const getLocalBlueprints = (): BlueprintDocument[] => {
  try {
    const data = localStorage.getItem('communityos_local_blueprints');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Gagal membaca local blueprints:", e);
    return [];
  }
};

const saveLocalBlueprints = (blueprints: BlueprintDocument[]) => {
  try {
    localStorage.setItem('communityos_local_blueprints', JSON.stringify(blueprints));
  } catch (e) {
    console.error("Gagal menyimpan local blueprints:", e);
  }
};

const getLocalComments = (): Record<string, BlueprintComment[]> => {
  try {
    const data = localStorage.getItem('communityos_local_comments');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Gagal membaca komentar lokal:", e);
    return {};
  }
};

const saveLocalComments = (comments: Record<string, BlueprintComment[]>) => {
  try {
    localStorage.setItem('communityos_local_comments', JSON.stringify(comments));
  } catch (e) {
    console.error("Gagal menyimpan komentar lokal:", e);
  }
};

// Recalculate local stats
export const recalculateLocalOrgStats = () => {
  try {
    const blueprints = getLocalBlueprints();
    const orgAggregates: Record<string, {
      name: string;
      totalEvents: number;
      totalParticipants: number;
      totalBudget: number;
      eventTypes: Record<string, number>;
      locations: string[];
      creatorIds: string[];
    }> = {};

    for (const bp of blueprints) {
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
          locations: [],
          creatorIds: [],
        };
      }

      const agg = orgAggregates[orgId];
      if (bp.realizationStatus === 'realized') {
        agg.totalEvents += 1;
        const actualPart = bp.realizationDetails?.actualParticipants !== undefined 
          ? Number(bp.realizationDetails.actualParticipants) 
          : Number(bp.originalData?.participants || 0);
        agg.totalParticipants += actualPart;
        agg.totalBudget += Number(bp.originalData?.budget || 0);
      }

      const type = bp.originalData?.type || 'Lainnya';
      agg.eventTypes[type] = (agg.eventTypes[type] || 0) + 1;

      if (bp.originalData?.location && !agg.locations.includes(bp.originalData.location)) {
        agg.locations.push(bp.originalData.location);
      }
      const owner = bp.ownerId || 'gerilya_leader';
      if (!agg.creatorIds.includes(owner)) {
        agg.creatorIds.push(owner);
      }
    }

    const localOrgs: OrganizationProfile[] = Object.entries(orgAggregates).map(([orgId, agg]) => ({
      id: orgId,
      name: agg.name,
      totalEvents: agg.totalEvents,
      totalParticipants: agg.totalParticipants,
      totalBudget: agg.totalBudget,
      eventTypes: agg.eventTypes,
      locations: agg.locations,
      creatorIds: agg.creatorIds,
      lastActive: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    }));

    localStorage.setItem('communityos_local_organizations', JSON.stringify(localOrgs));
  } catch (e) {
    console.error("Gagal melakukan kalkulasi stats lokal:", e);
  }
};

// --- Firestore Cloud Synchronization Helper ---

const syncOrgStatsToFirestore = async (originalData: EventData, status: string, details?: any) => {
  const orgName = originalData?.organization;
  if (!orgName || !db) return;

  const orgId = orgName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (!orgId) return;

  try {
    const orgRef = doc(db, 'organizations', orgId);
    const snap = await getDoc(orgRef);
    
    let totalEvents = 0;
    let totalParticipants = 0;
    let totalBudget = 0;
    const eventTypes: Record<string, number> = {};
    const locations: string[] = [];
    const creatorIds: string[] = [];

    if (snap.exists()) {
      const currentData = snap.data();
      totalEvents = currentData.totalEvents || 0;
      totalParticipants = currentData.totalParticipants || 0;
      totalBudget = currentData.totalBudget || 0;
      Object.assign(eventTypes, currentData.eventTypes || {});
      if (currentData.locations) {
        currentData.locations.forEach((loc: string) => {
          if (!locations.includes(loc)) locations.push(loc);
        });
      }
      if (currentData.creatorIds) {
        currentData.creatorIds.forEach((id: string) => {
          if (!creatorIds.includes(id)) creatorIds.push(id);
        });
      }
    }

    if (status === 'realized') {
      totalEvents += 1;
      const actualPart = details?.actualParticipants !== undefined 
        ? Number(details.actualParticipants) 
        : Number(originalData?.participants || 0);
      totalParticipants += actualPart;
      totalBudget += Number(originalData?.budget || 0);
    }

    const type = originalData?.type || 'Lainnya';
    eventTypes[type] = (eventTypes[type] || 0) + 1;

    if (originalData?.location && !locations.includes(originalData.location)) {
      locations.push(originalData.location);
    }

    const owner = auth?.currentUser?.uid || 'gerilya_leader';
    if (!creatorIds.includes(owner)) {
      creatorIds.push(owner);
    }

    await setDoc(orgRef, {
      name: orgName,
      totalEvents,
      totalParticipants,
      totalBudget,
      eventTypes,
      locations,
      creatorIds,
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("Gagal menyinkronkan stats organisasi ke server:", err);
  }
};

// --- Exposed Methods (Hybrid: Cloud Active + Local Fallback) ---

export const recalculateAndSyncOrganizationStats = async () => {
  // Always run local calculation first
  recalculateLocalOrgStats();

  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      console.log("Memulai proses Banting Tulang: Sinkronisasi & Pemulihan Basis Data...");
      
      // 1. Ambil semua blueprint lokal
      const blueprints = getLocalBlueprints();

      // 2. Mengambil seluruh blueprint dari cloud yang dimiliki atau kolaborasi
      const serverBlueprints: BlueprintDocument[] = [];
      const q = query(collection(db, 'blueprints'), where('ownerId', '==', currentUid));
      const querySnap = await getDocs(q);
      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        const createdAt = data.createdAt?.seconds ? { seconds: data.createdAt.seconds } : data.createdAt;
        const updatedAt = data.updatedAt?.seconds ? { seconds: data.updatedAt.seconds } : data.updatedAt;
        serverBlueprints.push({
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt
        } as BlueprintDocument);
      });

      const userEmail = auth?.currentUser?.email;
      if (userEmail) {
        const qCollab = query(collection(db, 'blueprints'), where('collaborators', 'array-contains', userEmail));
        const collabSnap = await getDocs(qCollab);
        collabSnap.forEach((docSnap) => {
          if (!serverBlueprints.some(b => b.id === docSnap.id)) {
            const data = docSnap.data();
            const createdAt = data.createdAt?.seconds ? { seconds: data.createdAt.seconds } : data.createdAt;
            const updatedAt = data.updatedAt?.seconds ? { seconds: data.updatedAt.seconds } : data.updatedAt;
            serverBlueprints.push({
              id: docSnap.id,
              ...data,
              createdAt,
              updatedAt
            } as BlueprintDocument);
          }
        });
      }

      // 3. Rekonsiliasi sinkron: unggah blueprint lokal yang baru/belum ada ke cloud
      for (const lb of blueprints) {
        if (lb.ownerId === currentUid) {
          const existsOnServer = serverBlueprints.some(sb => sb.id === lb.id);
          if (!existsOnServer) {
            try {
              const serverRef = doc(db, 'blueprints', lb.id);
              await setDoc(serverRef, {
                data: lb.data,
                originalData: lb.originalData,
                ownerId: lb.ownerId,
                collaborators: lb.collaborators || [],
                isPublic: lb.isPublic || false,
                realizationStatus: lb.realizationStatus || 'draft',
                realizationDetails: lb.realizationDetails || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              console.log(`Berhasil mengunggah blueprint ${lb.id} ke cloud.`);
              serverBlueprints.push(lb);
            } catch (err) {
              console.warn(`Gagal mencadangkan blueprint ${lb.id}:`, err);
            }
          }
        }
      }

      // 4. Perbarui penyimpanan lokal dengan data terbaru dari server
      const updatedLocal = [...blueprints];
      serverBlueprints.forEach(sb => {
        const idx = updatedLocal.findIndex(l => l.id === sb.id);
        if (idx !== -1) {
          updatedLocal[idx] = sb;
        } else {
          updatedLocal.push(sb);
        }
      });
      saveLocalBlueprints(updatedLocal);

      // 5. Hitung menyeluruh statistik organisasi berdasarkan seluruh dokumen tergabung
      const finalBlueprints = updatedLocal;
      const orgAggregates: Record<string, {
        name: string;
        totalEvents: number;
        totalParticipants: number;
        totalBudget: number;
        eventTypes: Record<string, number>;
        locations: string[];
        creatorIds: string[];
      }> = {};

      for (const bp of finalBlueprints) {
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
            locations: [],
            creatorIds: [],
          };
        }

        const agg = orgAggregates[orgId];
        if (bp.realizationStatus === 'realized') {
          agg.totalEvents += 1;
          const actualPart = bp.realizationDetails?.actualParticipants !== undefined 
            ? Number(bp.realizationDetails.actualParticipants) 
            : Number(bp.originalData?.participants || 0);
          agg.totalParticipants += actualPart;
          agg.totalBudget += Number(bp.originalData?.budget || 0);
        }

        const type = bp.originalData?.type || 'Lainnya';
        agg.eventTypes[type] = (agg.eventTypes[type] || 0) + 1;

        if (bp.originalData?.location && !agg.locations.includes(bp.originalData.location)) {
          agg.locations.push(bp.originalData.location);
        }
        if (bp.ownerId && !agg.creatorIds.includes(bp.ownerId)) {
          agg.creatorIds.push(bp.ownerId);
        }
      }

      // 6. Tulis ulang/selaraskan setiap profil organisasi secara masif di cloud Firestore & lokal
      const syncProfiles: OrganizationProfile[] = [];
      for (const [orgId, agg] of Object.entries(orgAggregates)) {
        const orgProfile: OrganizationProfile = {
          id: orgId,
          name: agg.name,
          totalEvents: agg.totalEvents,
          totalParticipants: agg.totalParticipants,
          totalBudget: agg.totalBudget,
          eventTypes: agg.eventTypes,
          locations: agg.locations,
          creatorIds: agg.creatorIds,
          lastActive: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
        };
        syncProfiles.push(orgProfile);

        try {
          // Selaraskan ke Firestore
          const orgRef = doc(db, 'organizations', orgId);
          await setDoc(orgRef, {
            name: agg.name,
            totalEvents: agg.totalEvents,
            totalParticipants: agg.totalParticipants,
            totalBudget: agg.totalBudget,
            eventTypes: agg.eventTypes,
            locations: agg.locations,
            creatorIds: agg.creatorIds,
            lastActive: serverTimestamp()
          }, { merge: true });
        } catch (orgErr) {
          console.warn(`Gagal menyelaraskan organisasi ${orgId} ke cloud:`, orgErr);
        }
      }

      localStorage.setItem('communityos_local_organizations', JSON.stringify(syncProfiles));
      console.log("Banting Tulang Selesai! Seluruh data diselaraskan dan dipulihkan dengan sukses.");
      return true;
    } catch (err) {
      console.error("Gagal menjalankan banting tulang pemulihan menyeluruh:", err);
      // Fallback
      recalculateLocalOrgStats();
      return true;
    }
  }

  return true;
};

export const saveBlueprintToCloud = async (data: Blueprint, originalData: EventData): Promise<string> => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;
  const localId = 'bp-' + Math.random().toString(36).substring(2, 9);
  const nowInSecs = Math.floor(Date.now() / 1000);

  // 1. AlWays Save Locally (Offline-First!)
  const localDoc: BlueprintDocument = {
    id: localId,
    data,
    originalData,
    ownerId: currentUid,
    collaborators: [],
    isPublic: false,
    realizationStatus: 'draft',
    createdAt: { seconds: nowInSecs, nanoseconds: 0 },
    updatedAt: { seconds: nowInSecs, nanoseconds: 0 }
  };

  const blueprints = getLocalBlueprints();
  blueprints.push(localDoc);
  saveLocalBlueprints(blueprints);
  recalculateLocalOrgStats();

  // 2. Cloud Sync
  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const serverRef = doc(db, 'blueprints', localId);
      await setDoc(serverRef, {
        data,
        originalData,
        ownerId: currentUid,
        collaborators: [],
        isPublic: false,
        realizationStatus: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("Blueprint tersinkronisasi ke Firestore.");
      await syncOrgStatsToFirestore(originalData, 'draft');
    } catch (e) {
      console.warn("Gagal sinkronisasi data ke cloud, berjalan di Mode Gerilya Lokal:", e);
    }
  }

  return localId;
};

export const updateBlueprintInCloud = async (blueprintId: string, data: Blueprint, originalData: EventData) => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  // 1. Local update
  try {
    const blueprints = getLocalBlueprints();
    const idx = blueprints.findIndex(b => b.id === blueprintId);
    if (idx !== -1) {
      blueprints[idx].data = data;
      blueprints[idx].originalData = originalData;
      blueprints[idx].updatedAt = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      saveLocalBlueprints(blueprints);
      recalculateLocalOrgStats();
    }
  } catch (e) {
    console.error("Gagal melokalisasi update updateBlueprintInCloud:", e);
  }

  // 2. Cloud update
  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const serverRef = doc(db, 'blueprints', blueprintId);
      await updateDoc(serverRef, {
        data,
        originalData,
        updatedAt: serverTimestamp()
      });
      await syncOrgStatsToFirestore(originalData, 'draft');
    } catch (e) {
      console.warn("Gagal update cloud, tetap berjalan offline:", e);
    }
  }
};

export const updateBlueprintRealizationStatus = async (
  blueprintId: string, 
  status: 'draft' | 'ready' | 'realized', 
  details?: any,
  originalData?: EventData
) => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  // 1. Local status update
  try {
    const blueprints = getLocalBlueprints();
    const idx = blueprints.findIndex(b => b.id === blueprintId);
    if (idx !== -1) {
      blueprints[idx].realizationStatus = status;
      if (details) {
        blueprints[idx].realizationDetails = details;
      } else if (status === 'draft') {
        delete blueprints[idx].realizationDetails;
      }
      blueprints[idx].updatedAt = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      saveLocalBlueprints(blueprints);
      recalculateLocalOrgStats();
    }
  } catch (e) {
    console.error("Gagal memperbarui status realisasi lokal:", e);
  }

  // 2. Cloud status update
  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const serverRef = doc(db, 'blueprints', blueprintId);
      const updateData: any = {
        realizationStatus: status,
        updatedAt: serverTimestamp()
      };
      if (details) {
        updateData.realizationDetails = details;
      }
      await updateDoc(serverRef, updateData);

      // Trigger organization stats update
      const snap = await getDoc(serverRef);
      if (snap.exists()) {
        const bpData = snap.data();
        if (bpData.originalData) {
          await syncOrgStatsToFirestore(bpData.originalData, status, details);
        }
      }
      return true;
    } catch (e) {
      console.warn("Gagal memperbarui status realisasi di cloud:", e);
    }
  }
  return true;
};

export const getBlueprintFromCloud = async (blueprintId: string): Promise<BlueprintDocument | null> => {
  const currentUid = auth?.currentUser?.uid;
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  // Try server first
  if (db && !isGuest && currentUid) {
    try {
      const snap = await getDoc(doc(db, 'blueprints', blueprintId));
      if (snap.exists()) {
        const docData = snap.data();
        const createdAt = docData.createdAt?.seconds ? { seconds: docData.createdAt.seconds } : docData.createdAt;
        const updatedAt = docData.updatedAt?.seconds ? { seconds: docData.updatedAt.seconds } : docData.updatedAt;
        return {
          id: snap.id,
          ...docData,
          createdAt,
          updatedAt
        } as BlueprintDocument;
      }
    } catch (e) {
      console.warn("Gagal mengambil blueprint dari Firestore, beralih ke lokal:", e);
    }
  }

  // Local fallback
  const blueprints = getLocalBlueprints();
  return blueprints.find(b => b.id === blueprintId) || null;
};

export const getUserBlueprints = async (): Promise<BlueprintDocument[]> => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const serverBlueprints: BlueprintDocument[] = [];
      
      // Query 1: Owned blueprints
      const q = query(collection(db, 'blueprints'), where('ownerId', '==', currentUid));
      const querySnap = await getDocs(q);
      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        const createdAt = data.createdAt?.seconds ? { seconds: data.createdAt.seconds } : data.createdAt;
        const updatedAt = data.updatedAt?.seconds ? { seconds: data.updatedAt.seconds } : data.updatedAt;
        serverBlueprints.push({
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt
        } as BlueprintDocument);
      });

      // Query 2: Collaborating blueprints
      const userEmail = auth?.currentUser?.email;
      if (userEmail) {
        const qCollab = query(collection(db, 'blueprints'), where('collaborators', 'array-contains', userEmail));
        const collabSnap = await getDocs(qCollab);
        collabSnap.forEach((docSnap) => {
          if (!serverBlueprints.some(b => b.id === docSnap.id)) {
            const data = docSnap.data();
            const createdAt = data.createdAt?.seconds ? { seconds: data.createdAt.seconds } : data.createdAt;
            const updatedAt = data.updatedAt?.seconds ? { seconds: data.updatedAt.seconds } : data.updatedAt;
            serverBlueprints.push({
              id: docSnap.id,
              ...data,
              createdAt,
              updatedAt
            } as BlueprintDocument);
          }
        });
      }

      // Reconcile and Sync server results to Local cache
      const localBlueprints = getLocalBlueprints();
      const updatedLocal = [...localBlueprints];

      serverBlueprints.forEach(sb => {
        const idx = updatedLocal.findIndex(l => l.id === sb.id);
        if (idx !== -1) {
          updatedLocal[idx] = sb;
        } else {
          updatedLocal.push(sb);
        }
      });
      saveLocalBlueprints(updatedLocal);
      recalculateLocalOrgStats();

      return serverBlueprints.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    } catch (e) {
      console.warn("Gagal fetching dari Firestore, melayani dari cache lokal:", e);
    }
  }

  // Fallback to local storage if Guest or Offline
  const local = getLocalBlueprints().filter(b => b.ownerId === currentUid || b.collaborators.includes(currentUid) || (auth?.currentUser?.email && b.collaborators.includes(auth.currentUser.email)));
  return local.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
};

export const addCollaborator = async (blueprintId: string, userEmail: string) => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  // Local update
  try {
    const blueprints = getLocalBlueprints();
    const idx = blueprints.findIndex(b => b.id === blueprintId);
    if (idx !== -1) {
      if (!blueprints[idx].collaborators.includes(userEmail)) {
        blueprints[idx].collaborators.push(userEmail);
        saveLocalBlueprints(blueprints);
      }
    }
  } catch (e) {
    console.error("Gagal menambah kolaborator lokal:", e);
  }

  // Cloud update
  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const serverRef = doc(db, 'blueprints', blueprintId);
      await updateDoc(serverRef, {
        collaborators: arrayUnion(userEmail),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Gagal menambah kolaborator di cloud:", e);
    }
  }
};

export const togglePublicAccess = async (blueprintId: string, isPublic: boolean) => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  // Local update
  try {
    const blueprints = getLocalBlueprints();
    const idx = blueprints.findIndex(b => b.id === blueprintId);
    if (idx !== -1) {
      blueprints[idx].isPublic = isPublic;
      saveLocalBlueprints(blueprints);
    }
  } catch (e) {
    console.error("Gagal toggle akses publik lokal:", e);
  }

  // Cloud update
  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const serverRef = doc(db, 'blueprints', blueprintId);
      await updateDoc(serverRef, {
        isPublic,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Gagal toggle akses publik di cloud:", e);
    }
  }
};

export const getAppSetting = async (key: string): Promise<any> => {
  // Try server first
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'settings', key));
      if (snap.exists()) {
        const val = snap.data().value;
        const localSettingsJson = localStorage.getItem('communityos_local_settings');
        const localSettings = localSettingsJson ? JSON.parse(localSettingsJson) : {};
        localSettings[key] = val;
        localStorage.setItem('communityos_local_settings', JSON.stringify(localSettings));
        return val;
      }
    } catch (e) {
      console.warn("Gagal mengambil setting dari Firestore, melayani lokal:", e);
    }
  }

  // Local fallback
  try {
    const localSettingsJson = localStorage.getItem('communityos_local_settings');
    const localSettings = localSettingsJson ? JSON.parse(localSettingsJson) : {};
    if (localSettings[key] !== undefined) {
      return localSettings[key];
    }
  } catch (error) {}
  return DEFAULT_SETTINGS[key] || null;
};

export const updateAppSetting = async (key: string, value: any) => {
  // Local update
  try {
    const localSettingsJson = localStorage.getItem('communityos_local_settings');
    const localSettings = localSettingsJson ? JSON.parse(localSettingsJson) : {};
    localSettings[key] = value;
    localStorage.setItem('communityos_local_settings', JSON.stringify(localSettings));
  } catch (error) {
    console.error("Gagal memperbarui pengaturan lokal:", error);
  }

  // Cloud sync (Only for admin)
  if (db && auth?.currentUser?.email === 'papadaan49@gmail.com') {
    try {
      await setDoc(doc(db, 'settings', key), {
        value,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Gagal memperbarui setting di cloud:", e);
    }
  }
};

export const getOrgProfiles = async (): Promise<OrganizationProfile[]> => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  recalculateLocalOrgStats();

  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const q = query(collection(db, 'organizations'), where('creatorIds', 'array-contains', currentUid));
      const snap = await getDocs(q);
      const serverOrgs: OrganizationProfile[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        serverOrgs.push({
          id: docSnap.id,
          name: data.name,
          totalEvents: data.totalEvents || 0,
          totalParticipants: data.totalParticipants || 0,
          totalBudget: data.totalBudget || 0,
          eventTypes: data.eventTypes || {},
          locations: data.locations || [],
          creatorIds: data.creatorIds || [],
          lastActive: data.lastActive?.seconds ? { seconds: data.lastActive.seconds } : data.lastActive
        });
      });
      return serverOrgs;
    } catch (e) {
      console.warn("Gagal mengambil profiles organisasi dari server:", e);
    }
  }

  const localOrgsJson = localStorage.getItem('communityos_local_organizations');
  const localOrgs: OrganizationProfile[] = localOrgsJson ? JSON.parse(localOrgsJson) : [];
  return localOrgs.filter(o => o.creatorIds.includes(currentUid));
};

export const getAllOrgProfiles = async (): Promise<OrganizationProfile[]> => {
  recalculateLocalOrgStats();

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'organizations'));
      const serverOrgs: OrganizationProfile[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        serverOrgs.push({
          id: docSnap.id,
          name: data.name,
          totalEvents: data.totalEvents || 0,
          totalParticipants: data.totalParticipants || 0,
          totalBudget: data.totalBudget || 0,
          eventTypes: data.eventTypes || {},
          locations: data.locations || [],
          creatorIds: data.creatorIds || [],
          lastActive: data.lastActive?.seconds ? { seconds: data.lastActive.seconds } : data.lastActive
        });
      });
      return serverOrgs;
    } catch (e) {
      console.warn("Gagal mengambil semua profiles organisasi dari server:", e);
    }
  }

  const localOrgsJson = localStorage.getItem('communityos_local_organizations');
  return localOrgsJson ? JSON.parse(localOrgsJson) : [];
};

export const getUserStats = async (): Promise<{ totalBlueprints: number, totalParticipants: number }> => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const q = query(collection(db, 'blueprints'), where('ownerId', '==', currentUid));
      const snap = await getDocs(q);
      let totalBlueprints = 0;
      let totalParticipants = 0;
      snap.forEach(docSnap => {
        totalBlueprints++;
        const bp = docSnap.data();
        if (bp.realizationStatus === 'realized') {
          const actualPart = bp.realizationDetails?.actualParticipants !== undefined
            ? Number(bp.realizationDetails.actualParticipants)
            : Number(bp.originalData?.participants || 0);
          totalParticipants += actualPart;
        } else {
          totalParticipants += Number(bp.originalData?.participants || 0);
        }
      });
      return { totalBlueprints, totalParticipants };
    } catch (e) {
      console.warn("Gagal mengambil stats dari server:", e);
    }
  }

  const blueprints = getLocalBlueprints().filter(b => b.ownerId === currentUid);
  let totalParticipants = 0;
  blueprints.forEach(b => {
    if (b.realizationStatus === 'realized') {
      const actualPart = b.realizationDetails?.actualParticipants !== undefined
        ? Number(b.realizationDetails.actualParticipants)
        : Number(b.originalData?.participants || 0);
      totalParticipants += actualPart;
    } else {
      totalParticipants += Number(b.originalData?.participants || 0);
    }
  });
  return {
    totalBlueprints: blueprints.length,
    totalParticipants
  };
};

export const postComment = async (blueprintId: string, text: string) => {
  const authorName = auth?.currentUser?.displayName || 'Relawan Mandiri';
  const authorPhoto = auth?.currentUser?.photoURL || '';
  const authorId = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;
  const commentId = 'comment-' + Math.random().toString(36).substring(2, 9);
  const nowInSecs = Math.floor(Date.now() / 1000);

  // Local storage save
  try {
    const allComments = getLocalComments();
    if (!allComments[blueprintId]) {
      allComments[blueprintId] = [];
    }
    const newComment: BlueprintComment = {
      id: commentId,
      text,
      authorId,
      authorName,
      authorPhoto: authorPhoto || undefined,
      createdAt: { seconds: nowInSecs, nanoseconds: 0 }
    };
    allComments[blueprintId].push(newComment);
    saveLocalComments(allComments);
  } catch (e) {
    console.error("Gagal menambahkan komentar lokal:", e);
  }

  // Cloud sync
  if (db && !isGuest && authorId !== 'gerilya_leader') {
    try {
      const commentRef = doc(db, 'blueprints', blueprintId, 'comments', commentId);
      await setDoc(commentRef, {
        text,
        authorId,
        authorName,
        authorPhoto: authorPhoto || null,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Gagal mengirimkan komentar ke server cloud:", e);
    }
  }
};

export const getComments = async (blueprintId: string): Promise<BlueprintComment[]> => {
  const currentUid = auth?.currentUser?.uid || 'gerilya_leader';
  const isGuest = !auth?.currentUser || (auth?.currentUser as any).isGuest;

  if (db && !isGuest && currentUid !== 'gerilya_leader') {
    try {
      const q = query(collection(db, 'blueprints', blueprintId, 'comments'));
      const snap = await getDocs(q);
      const serverComments: BlueprintComment[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        serverComments.push({
          id: docSnap.id,
          text: data.text,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhoto: data.authorPhoto || undefined,
          createdAt: data.createdAt?.seconds ? { seconds: data.createdAt.seconds } : data.createdAt
        });
      });
      return serverComments.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    } catch (e) {
      console.warn("Gagal mengambil komentar dari server:", e);
    }
  }

  const allLocal = getLocalComments();
  return allLocal[blueprintId] || [];
};
