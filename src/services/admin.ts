import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Room } from '@/types';

export type NewRoom = Omit<Room, 'id' | 'isCurrentlyAvailable'>;

export async function addRoom(room: NewRoom): Promise<void> {
  await addDoc(collection(db, 'Rooms'), { ...room, isCurrentlyAvailable: true, createdAt: serverTimestamp() });
}
