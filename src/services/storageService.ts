import { Blueprint } from '../types';

const STORAGE_KEY = 'communityos_history';
const MAX_HISTORY = 10;

export interface HistoryItem {
  id: string;
  cloudId?: string | null;
  title: string;
  city: string;
  scale: string;
  timestamp: number;
  data: Blueprint;
  originalData?: any; // To store original EventData for revision
}

export const saveBlueprintToHistory = (blueprint: Blueprint, originalData?: any, cloudId?: string | null) => {
  try {
    const historyJson = localStorage.getItem(STORAGE_KEY);
    let history: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      cloudId,
      title: blueprint.event_meta.title,
      city: blueprint.event_meta.location,
      scale: blueprint.event_meta.scale_classification,
      timestamp: Date.now(),
      data: blueprint,
      originalData
    };

    // Add to beginning and limit
    history = [newItem, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

export const getHistory = (): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const clearSessionCache = () => {
  // Clear any temporary session state if needed in the future
  sessionStorage.clear();
};
