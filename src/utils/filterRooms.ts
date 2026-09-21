import { FilterState, Room } from '@/types';

export function filterRooms(rooms: Room[], filters: FilterState): Room[] {
  const query = filters.searchQuery.trim().toLowerCase();
  return rooms.filter((room) => {
    const matchesSearch = !query || room.name.toLowerCase().includes(query) || room.building.toLowerCase().includes(query);
    const matchesBuilding = !filters.building || room.building === filters.building;
    const matchesCapacity = !filters.minCapacity || room.capacity >= filters.minCapacity;
    const matchesEquipment = filters.equipment.every((item) => room.equipment.includes(item));
    return matchesSearch && matchesBuilding && matchesCapacity && matchesEquipment;
  });
}
