import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';

const DB_NAME = 'TaskPro';
const DB_VERSION = 2;
const TASK_STORE = 'tasks';
const PREF_STORE = 'preferences';
const GAMIFICATION_STORE = 'gamification';

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(TASK_STORE)) {
          const store = db.createObjectStore(TASK_STORE, { keyPath: 'id' });
          store.createIndex('project', 'project');
          store.createIndex('completed', 'completed');
        }
        if (!db.objectStoreNames.contains(PREF_STORE)) {
          db.createObjectStore(PREF_STORE, { keyPath: 'key' });
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains(GAMIFICATION_STORE)) {
          db.createObjectStore(GAMIFICATION_STORE, { keyPath: 'key' });
        }
      }
    });
  }
  return dbPromise;
}

export async function loadAppData() {
  try {
    const db = await getDb();
    const tasks = await db.getAll(TASK_STORE) || [];
    const prefRecord = await db.get(PREF_STORE, 'ui');
    const gamificationRecord = await db.get(GAMIFICATION_STORE, 'profile');
    return {
      tasks,
      preferences: prefRecord?.value || {},
      gamification: gamificationRecord?.value || null
    };
  } catch (error) {
    console.error('Failed to load data', error);
    return { tasks: [], preferences: {}, gamification: null };
  }
}

export async function persistTasks(tasks = []) {
  try {
    const db = await getDb();
    const tx = db.transaction([TASK_STORE], 'readwrite');
    const store = tx.objectStore(TASK_STORE);
    await store.clear();
    await Promise.all(tasks.map(task => store.put(task)));
    await tx.done;
  } catch (error) {
    console.error('Failed to persist tasks', error);
  }
}

export async function persistPreferences(preferences) {
  try {
    const db = await getDb();
    await db.put(PREF_STORE, { key: 'ui', value: preferences });
  } catch (error) {
    console.error('Failed to persist preferences', error);
  }
}

export async function persistGamification(gamification) {
  try {
    const db = await getDb();
    await db.put(GAMIFICATION_STORE, { key: 'profile', value: gamification });
  } catch (error) {
    console.error('Failed to persist gamification data', error);
  }
}
