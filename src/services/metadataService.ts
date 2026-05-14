import { Blueprint, EventData, OperationalMetadata } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const METADATA_KEY = "communityos_operational_metadata";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null, // No auth yet
      email: null,
    },
    operationType,
    path
  };
  const stringified = JSON.stringify(errInfo);
  console.error('Firestore Error: ', stringified);
  // We throw it so AI Studio can catch it for diagnostics, 
  // but the caller of saveOperationalMetadata handles it to be silent for UI
  throw new Error(stringified);
};

/**
 * Generates structured metadata from input data and AI-generated blueprint
 */
export const generateMetadata = (input: EventData, blueprint: Blueprint): OperationalMetadata => {
  return {
    event_name: blueprint.event_meta.title || input.name,
    organization: input.organization,
    city: blueprint.event_meta.location || input.location,
    event_type: input.type,
    participants: input.participants,
    committee_count: input.staff,
    budget: input.budget,
    blueprint_scale: blueprint.event_meta.scale_classification,
    burnout_risk: blueprint.event_meta.burnout_risk,
    operational_complexity: blueprint.event_meta.operational_complexity,
    coordination_intensity: blueprint.event_meta.coordination_intensity,
    wellbeing_risk_level: blueprint.wellbeing_guard.risk_level,
    timestamp: Date.now(),
  };
};

/**
 * Saves metadata to both Firestore and local operational memory
 * This runs silently in the background.
 */
export const saveOperationalMetadata = async (metadata: OperationalMetadata): Promise<void> => {
  const path = "blueprints";
  
  // Background firestore save
  const firestoreSave = async () => {
    try {
      await addDoc(collection(db, path), metadata);
      console.log("CommunityOS: Operational metadata saved to Firestore.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Run both in background but catch firestore to keep UI silent
  firestoreSave().catch(() => {
    // Already logged in handleFirestoreError
  });

  try {
    // Local storage fallback/cache
    const existingDataJson = localStorage.getItem(METADATA_KEY);
    const existingData: OperationalMetadata[] = existingDataJson ? JSON.parse(existingDataJson) : [];
    
    // Add new metadata and keep last 50 entries
    const updatedData = [metadata, ...existingData].slice(0, 50);
    localStorage.setItem(METADATA_KEY, JSON.stringify(updatedData));
    
    console.log("CommunityOS: Operational metadata saved to local memory.");
  } catch (error) {
    console.warn("CommunityOS: Local metadata save failed.", error);
  }
};
