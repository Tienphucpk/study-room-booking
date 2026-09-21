export type Building = 'A' | 'B' | 'C' | 'V';
export type Equipment = 'Projector' | 'Whiteboard' | 'HighSpecPC' | 'AC';

export interface Room { id: string; name: string; building: Building; floor: number; capacity: number; equipment: Equipment[]; photoUrl: string; isCurrentlyAvailable: boolean; }
export interface TimeSlot { id: string; startTime: string; endTime: string; }
export interface Booking { id: string; roomId: string; userId: string; date: string; slot: TimeSlot; qrCode: string; status: 'upcoming' | 'checked-in' | 'cancelled' | 'completed'; createdAt: string; notificationId?: string; }
export interface FilterState { searchQuery: string; building: Building | null; minCapacity: number | null; equipment: Equipment[]; }
export type UserRole = 'student' | 'admin';
export interface UserSession { userId: string; studentName: string; studentId: string; avatarUrl?: string; isLoggedIn: boolean; role: UserRole; }
