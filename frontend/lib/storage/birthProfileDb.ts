import { runTransaction, STORES } from "@/lib/storage/db";
import type { SavedBirthProfile } from "@/lib/storage/birthProfileTypes";

export const MAX_BIRTH_PROFILES = 30;

async function trimProfiles(): Promise<void> {
  const entries = await listBirthProfiles();
  const overflow = entries.slice(MAX_BIRTH_PROFILES);
  await Promise.all(overflow.map((entry) => deleteBirthProfile(entry.id)));
}

export async function saveBirthProfile(
  record: Omit<SavedBirthProfile, "id" | "savedAt"> & { id?: string },
): Promise<SavedBirthProfile> {
  const saved: SavedBirthProfile = {
    ...record,
    id: record.id ?? crypto.randomUUID(),
    savedAt: Date.now(),
  };

  await runTransaction(STORES.birthProfiles, "readwrite", (store) => store.put(saved));
  await trimProfiles();
  return saved;
}

export async function listBirthProfiles(): Promise<SavedBirthProfile[]> {
  const all = await runTransaction<SavedBirthProfile[]>(
    STORES.birthProfiles,
    "readonly",
    (store) => store.getAll(),
  );

  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function getBirthProfile(id: string): Promise<SavedBirthProfile | undefined> {
  return runTransaction<SavedBirthProfile | undefined>(
    STORES.birthProfiles,
    "readonly",
    (store) => store.get(id),
  );
}

export async function deleteBirthProfile(id: string): Promise<void> {
  await runTransaction(STORES.birthProfiles, "readwrite", (store) => store.delete(id));
}

export async function clearBirthProfiles(): Promise<void> {
  await runTransaction(STORES.birthProfiles, "readwrite", (store) => store.clear());
}
