import { collection, doc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { mockRooms } from '@/data/mockRooms';
import { db } from '@/services/firebase';
import { Room } from '@/types';

const roomsCollection = collection(db, 'Rooms');

/** Seeds the fixed room catalogue only once, when the Firestore collection is empty. */
export async function seedRoomsIfEmpty(): Promise<void> {
  const existing = await getDocs(roomsCollection);
  if (!existing.empty) return;
  const batch = writeBatch(db);
  mockRooms.forEach((room) => batch.set(doc(db, 'Rooms', room.id), { ...room, isCurrentlyAvailable: true }));
  await batch.commit();
}

/** Keeps the UI synchronized with the real Rooms collection in Firestore. */
export function listenToRooms(onRooms: (rooms: Room[]) => void, onError: (error: Error) => void): () => void {
  return onSnapshot(roomsCollection, (snapshot) => {
    const rooms = snapshot.docs
      .map((snapshotDoc) => ({ ...(snapshotDoc.data() as Omit<Room, 'id'>), id: snapshotDoc.id }))
      .sort((left, right) => left.name.localeCompare(right.name));
    onRooms(rooms);
  }, onError);
}
