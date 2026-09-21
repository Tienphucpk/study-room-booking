import { collection, doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Booking, Room, TimeSlot } from '@/types';

const bookingsCollection = collection(db, 'Bookings');
const slotKey = (roomId: string, date: string, slot: TimeSlot) => `${roomId}_${date}_${slot.id}`;

export function listenToBookings(onBookings: (bookings: Booking[]) => void, onError: (error: Error) => void): () => void {
  return onSnapshot(bookingsCollection, (snapshot) => {
    onBookings(snapshot.docs.map((item) => ({ ...(item.data() as Omit<Booking, 'id'>), id: item.id })));
  }, onError);
}

export async function reserveRoomSlot(room: Room, userId: string, date: string, slot: TimeSlot): Promise<Booking | { error: string }> {
  const bookingRef = doc(bookingsCollection);
  const reservationRef = doc(db, 'SlotReservations', slotKey(room.id, date, slot));
  const booking: Booking = {
    id: bookingRef.id, roomId: room.id, userId, date, slot,
    qrCode: `${room.id}-${date}-${slot.id}-${bookingRef.id}`,
    status: 'upcoming', createdAt: new Date().toISOString(),
  };
  try {
    await runTransaction(db, async (transaction) => {
      const reservation = await transaction.get(reservationRef);
      if (reservation.exists() && reservation.data().status === 'active') throw new Error('SLOT_TAKEN');
      transaction.set(bookingRef, booking);
      transaction.set(reservationRef, { bookingId: booking.id, roomId: room.id, date, slotId: slot.id, status: 'active' });
    });
    return booking;
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_TAKEN') return { error: 'Slot đã được đặt bởi người dùng khác.' };
    throw error;
  }
}

export async function cancelRemoteBooking(booking: Booking): Promise<void> {
  const bookingRef = doc(db, 'Bookings', booking.id);
  const reservationRef = doc(db, 'SlotReservations', slotKey(booking.roomId, booking.date, booking.slot));
  await runTransaction(db, async (transaction) => {
    const reservation = await transaction.get(reservationRef);
    transaction.update(bookingRef, { status: 'cancelled' });
    if (reservation.exists() && reservation.data().bookingId === booking.id) transaction.delete(reservationRef);
  });
}

export async function updateRemoteBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
  await updateDoc(doc(db, 'Bookings', bookingId), { status });
}

export async function updateRemoteBookingNotification(bookingId: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'Bookings', bookingId), { notificationId });
}
