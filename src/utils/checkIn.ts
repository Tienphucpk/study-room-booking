import { Booking } from '@/types';

const EARLY_CHECK_IN_MINUTES = 15;

export type CheckInWindow = 'too-early' | 'open' | 'closed';

function bookingDateTime(booking: Booking, time: string): Date {
  return new Date(`${booking.date}T${time}:00`);
}

export function getCheckInWindow(booking: Booking, now = new Date()): CheckInWindow {
  const startsAt = bookingDateTime(booking, booking.slot.startTime);
  const endsAt = bookingDateTime(booking, booking.slot.endTime);
  const opensAt = new Date(startsAt.getTime() - EARLY_CHECK_IN_MINUTES * 60_000);
  if (now < opensAt) return 'too-early';
  if (now > endsAt) return 'closed';
  return 'open';
}

export function checkInOpensAt(booking: Booking): Date {
  return new Date(bookingDateTime(booking, booking.slot.startTime).getTime() - EARLY_CHECK_IN_MINUTES * 60_000);
}
