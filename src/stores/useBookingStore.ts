import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mockRooms } from '@/data/mockRooms';
import { Booking, FilterState, Room, TimeSlot, UserSession } from '@/types';
import { cancelCheckInNotification, scheduleCheckInNotification } from '@/utils/notifications';
import { getCheckInWindow } from '@/utils/checkIn';
import { cancelRemoteBooking, reserveRoomSlot, updateRemoteBookingNotification, updateRemoteBookingStatus } from '@/services/bookings';

const emptyFilters: FilterState = { searchQuery: '', building: null, minCapacity: null, equipment: [] };
type BookingResult = Booking | { error: string };
interface BookingStore {
  session: UserSession | null; rooms: Room[]; bookings: Booking[]; filters: FilterState;
  login: (session: UserSession) => void; logout: () => void;
  setRooms: (rooms: Room[]) => void; setBookings: (bookings: Booking[]) => void;
  createBooking: (roomId: string, date: string, slot: TimeSlot) => Promise<BookingResult>;
  cancelBooking: (bookingId: string) => Promise<void>; getBookingsForRoomAndDate: (roomId: string, date: string) => Booking[];
  checkIn: (bookingId: string) => void; completeExpiredBookings: () => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void; resetFilters: () => void;
}
export const useBookingStore = create<BookingStore>()(persist((set, get) => ({
  session: null, rooms: mockRooms, bookings: [], filters: emptyFilters,
  login: (session) => set({ session }), logout: () => set({ session: null }),
  setRooms: (rooms) => set({ rooms: withLiveAvailability(rooms, get().bookings) }),
  setBookings: (bookings) => set((state) => ({ bookings, rooms: withLiveAvailability(state.rooms, bookings) })),
  createBooking: async (roomId, date, slot) => {
    const room = get().rooms.find((candidate) => candidate.id === roomId);
    const session = get().session;
    if (!room) return { error: 'Không tìm thấy phòng.' };
    if (!session) return { error: 'Vui lòng đăng nhập để đặt phòng.' };
    const result = await reserveRoomSlot(room, session.userId, date, slot);
    if ('error' in result) return result;
    const draft = result;
    set((state) => ({ bookings: [...state.bookings.filter((item) => item.id !== draft.id), draft] }));
    const notificationId = await scheduleCheckInNotification(draft, room);
    if (notificationId) {
      set((state) => ({ bookings: state.bookings.map((item) => item.id === draft.id ? { ...item, notificationId } : item) }));
      void updateRemoteBookingNotification(draft.id, notificationId);
    }
    return notificationId ? { ...draft, notificationId } : draft;
  },
  cancelBooking: async (bookingId) => {
    const booking = get().bookings.find((item) => item.id === bookingId);
    if (!booking) return;
    if (booking.notificationId) await cancelCheckInNotification(booking.notificationId);
    await cancelRemoteBooking(booking);
    set((state) => ({ bookings: state.bookings.map((item) => item.id === bookingId ? { ...item, status: 'cancelled' } : item) }));
  },
  checkIn: (bookingId) => {
    const booking = get().bookings.find((item) => item.id === bookingId);
    if (!booking || booking.status !== 'upcoming' || getCheckInWindow(booking) !== 'open') return;
    set((state) => ({ bookings: state.bookings.map((item) => item.id === bookingId ? { ...item, status: 'checked-in' } : item) }));
    void updateRemoteBookingStatus(bookingId, 'checked-in');
  },
  completeExpiredBookings: () => set((state) => ({ bookings: state.bookings.map((item) => {
    const endsAt = new Date(`${item.date}T${item.slot.endTime}:00`);
    return (item.status === 'upcoming' || item.status === 'checked-in') && endsAt <= new Date() ? { ...item, status: 'completed' } : item;
  }) })),
  getBookingsForRoomAndDate: (roomId, date) => get().bookings.filter((booking) => booking.roomId === roomId && booking.date === date),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })), resetFilters: () => set({ filters: emptyFilters }),
}), { name: 'vku-booking-storage', storage: createJSONStorage(() => AsyncStorage), partialize: (state) => ({ session: state.session, bookings: state.bookings, filters: state.filters }) }));

function withLiveAvailability(rooms: Room[], bookings: Booking[]): Room[] {
  const now = new Date();
  return rooms.map((room) => ({ ...room, isCurrentlyAvailable: !bookings.some((booking) => {
    const start = new Date(`${booking.date}T${booking.slot.startTime}:00`);
    const end = new Date(`${booking.date}T${booking.slot.endTime}:00`);
    return booking.roomId === room.id && booking.status !== 'cancelled' && start <= now && now < end;
  }) }));
}
