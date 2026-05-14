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
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
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
