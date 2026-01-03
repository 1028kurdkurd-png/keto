import { openDB } from 'idb';

type OutboxItem = {
  id?: number;
  kind: string;
  payload: any;
  createdAt: number;
};

const DB_NAME = 'mazin-offline';
const STORE = 'outbox';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

export async function addOutboxItem(kind: string, payload: any) {
  const db = await getDB();
  const item: OutboxItem = { kind, payload, createdAt: Date.now() };
  const id = await db.add(STORE, item as any);
  return id;
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  const db = await getDB();
  return (await db.getAll(STORE)) as OutboxItem[];
}

export async function removeOutboxItem(id: number) {
  const db = await getDB();
  return db.delete(STORE, id);
}

export async function clearOutbox() {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  await tx.objectStore(STORE).clear();
  await tx.done;
}

// processOutbox expects a handlers map: { [kind]: async (payload) => boolean }
export async function processOutbox(handlers: Record<string, (_payload: any) => Promise<boolean>>) {
  const items = await getOutboxItems();
  for (const item of items) {
    const handler = handlers[item.kind];
    if (!handler) continue; // no handler registered
    try {
      const ok = await handler(item.payload);
      if (ok) {
        if (typeof item.id === 'number') await removeOutboxItem(item.id);
      }
    } catch (e) {
      console.warn('Outbox handler failed for', item.kind, e);
      // keep item for retry later
    }
  }
}

export async function outboxCount() {
  const db = await getDB();
  return (await db.count(STORE)) as number;
}
