import { Equipment, Room, TimeSlot } from '@/types';

export const TIME_SLOTS: TimeSlot[] = [
  ['07:30', '09:30'], ['09:30', '11:30'], ['13:00', '15:00'], ['15:00', '17:00'], ['17:30', '19:30'],
].map(([startTime, endTime]) => ({ id: `${startTime}-${endTime}`, startTime, endTime }));

const equipment: Equipment[] = ['Projector', 'Whiteboard', 'HighSpecPC', 'AC'];
const buildings: Room['building'][] = ['A', 'B', 'C', 'V'];

export const mockRooms: Room[] = Array.from({ length: 56 }, (_, index) => {
  const number = index + 1;
  const building = buildings[index % buildings.length];
  return {
    id: `room-${number}`, name: `${building}${String(100 + number).padStart(3, '0')}`,
    building, floor: (index % 5) + 1, capacity: [12, 20, 30, 40, 60][index % 5],
    equipment: equipment.filter((_, equipmentIndex) => (index + equipmentIndex) % 3 !== 0),
    photoUrl: `https://picsum.photos/seed/vku-room-${number}/800/500`,
    // Availability is determined by live booking data; new rooms start as available.
    isCurrentlyAvailable: true,
  };
});
