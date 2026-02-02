/**
 * Client-side Google Sheets Fetcher
 * Fetches published XLSX files, caches them, and parses for full data access
 * 
 * This approach:
 * 1. Fetches the XLSX export from Google Sheets
 * 2. Stores it in IndexedDB cache for persistence
 * 3. Parses from cache to access all rows (bypasses row limits)
 */

import { TaskWithStatus } from '@/types';
import { parseXLSXFile, computeTaskStatus } from './dataParser';
import { normalizeSiteWeights } from './dataProcessor';

// IndexedDB for persistent file cache
const DB_NAME = 'BEmONC_FileCache';
const STORE_NAME = 'xlsx_files';
const DB_VERSION = 1;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getCachedFile(url: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (err) {
    console.warn('Failed to read from cache:', err);
    return null;
  }
}

async function setCachedFile(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, url);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to write to cache:', err);
  }
}

async function fetchAndCacheXLSX(url: string): Promise<Blob> {
  // Try to get from cache first
  const cached = await getCachedFile(url);
  if (cached) {
    console.log('✅ Using cached XLSX file');
    return cached;
  }

  console.log('Fetching XLSX from Google Sheets...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const blob = await response.blob();
  
  // Cache the blob for future use
  await setCachedFile(url, blob);
  console.log('✅ XLSX file cached successfully');
  
  return blob;
}

export interface SheetSource {
    packageId: string;
    packageName: string;
    publishedXlsxUrl: string;
}

export const SHEET_SOURCES: SheetSource[] = [
    {
        packageId: 'Bemonc7-rehab',
        packageName: 'Bemonc7-rehab',
        publishedXlsxUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBwi3MLqWQC5SPJsFBS6DHS1SCMlNyxDlVceblbIe3yf4RGYzTueN7T9JKpN1HERVy2qAKKa6ziLvB/pub?output=xlsx',
    },
];

/**
 * Fetch and parse a single published Google Sheet XLSX file
 * Uses cache to store the file locally, then parses for full data access
 */
async function fetchSheetAsXLSX(source: SheetSource): Promise<TaskWithStatus[]> {
    try {
        console.log(`Fetching ${source.packageId} from Google Sheets (with cache)...`);

        // Fetch and cache the XLSX file
        const blob = await fetchAndCacheXLSX(source.publishedXlsxUrl);
        
        // Convert blob to File
        const file = new File([blob], `${source.packageId}.xlsx`, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        // Parse the cached file
        const tasks = await parseXLSXFile(file);

        // Compute status for each task
        const tasksWithStatus = tasks.map(task => computeTaskStatus(task));

        console.log(`✅ ${source.packageId}: Loaded ${tasksWithStatus.length} tasks from cache`);
        return tasksWithStatus;
    } catch (error) {
        console.error(`❌ ${source.packageId}: Failed to fetch`, error);
        return [];
    }
}

/**
 * Fetch all published Google Sheets and combine into processed tasks
 */
export async function fetchAllGoogleSheets(): Promise<TaskWithStatus[]> {
    console.log('=== FETCHING ALL GOOGLE SHEETS (with cache) ===');
    const startTime = Date.now();

    // Fetch all sheets in parallel
    const results = await Promise.all(
        SHEET_SOURCES.map(source => fetchSheetAsXLSX(source))
    );

    // Combine all tasks
    const allTasks = results.flat();
    console.log(`Total raw tasks: ${allTasks.length}`);

    // Deduplicate by task_uid
    const taskMap = new Map<string, TaskWithStatus>();
    allTasks.forEach(task => {
        if (!taskMap.has(task.task_uid)) {
            taskMap.set(task.task_uid, task);
        }
    });

    const uniqueTasks = Array.from(taskMap.values());
    console.log(`Deduplicated to ${uniqueTasks.length} unique tasks`);

    // Normalize weights per site
    const normalizedTasks = normalizeSiteWeights(uniqueTasks);

    const endTime = Date.now();
    console.log(`=== FETCH COMPLETE (${endTime - startTime}ms) ===`);

    return normalizedTasks;
}

/**
 * Clear the XLSX file cache (for manual refresh)
 */
export async function clearXLSXCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('✅ XLSX cache cleared');
        resolve();
      };
    });
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}
