import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QRCheckInModal } from '@/components/QRCheckInModal';
import { AuthGate } from '@/components/AuthGate';
import { ROOM_CARD_HEIGHT, RoomCard } from '@/components/RoomCard';
import { useBookingStore } from '@/stores/useBookingStore';
import { listenToRooms, seedRoomsIfEmpty } from '@/services/rooms';
import { listenToBookings } from '@/services/bookings';
import { Building, Equipment, Room, TimeSlot, Booking } from '@/types';
import { filterRooms } from '@/utils/filterRooms';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type Tab = 'rooms' | 'bookings';
const buildings: Building[] = ['A', 'B', 'C', 'V'];
const equipment: Equipment[] = ['Projector', 'Whiteboard', 'HighSpecPC', 'AC'];
const past = (date: string, slot: TimeSlot) => new Date(`${date}T${slot.startTime}:00`) <= new Date();

export default function HomeScreen() {
  return (
    <AuthGate>
      <BookingApp />
    </AuthGate>
  );
}

function BookingApp() {
  const inset = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('rooms');
  const [qr, setQR] = useState<string | null>(null);
  const rooms = useBookingStore((x) => x.rooms);
  const setRooms = useBookingStore((x) => x.setRooms);
  const setBookings = useBookingStore((x) => x.setBookings);
  const booking = useBookingStore((x) => x.bookings.find((b) => b.id === qr) ?? null);
  const checkIn = useBookingStore((x) => x.checkIn);

  useEffect(() => {
    const unsubscribe = listenToRooms(setRooms, (error) => console.warn('[Firestore Rooms]', error));
    void seedRoomsIfEmpty().catch(() => {});
    return () => {
      unsubscribe();
    };
  }, [setRooms]);

  useEffect(() => listenToBookings(setBookings, (error) => console.warn('[Firestore Bookings]', error)), [setBookings]);

  return (
    <View style={[s.app, { paddingTop: inset.top }]}>
      {tab === 'rooms' ? <Rooms /> : <Bookings showQR={setQR} />}

      {/* Floating Bottom Navigation */}
      <View style={[s.floatingNavContainer, { paddingBottom: Math.max(spacing.md, inset.bottom) }]}>
        <View style={s.floatingNavBar}>
          <Nav
            active={tab === 'rooms'}
            icon={tab === 'rooms' ? 'grid' : 'grid-outline'}
            label="Phòng học"
            press={() => setTab('rooms')}
          />
          <Nav
            active={tab === 'bookings'}
            icon={tab === 'bookings' ? 'ticket' : 'ticket-outline'}
            label="Lịch đặt phòng"
            press={() => setTab('bookings')}
          />
        </View>
      </View>

      <QRCheckInModal
        booking={booking}
        room={booking ? rooms.find((r) => r.id === booking.roomId) : undefined}
        onCheckIn={checkIn}
        onClose={() => setQR(null)}
      />
    </View>
  );
}

function Rooms() {
  const rooms = useBookingStore((x) => x.rooms);
  const filters = useBookingStore((x) => x.filters);
  const set = useBookingStore((x) => x.setFilter);
  const reset = useBookingStore((x) => x.resetFilters);
  const [query, setQuery] = useState(filters.searchQuery);
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => set('searchQuery', query), 300);
    return () => clearTimeout(timer);
  }, [query, set]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const result = useMemo(() => filterRooms(rooms, filters), [rooms, filters]);
  const open = useCallback((id: string) => router.push(`/room/${id}` as never), []);

  const activeFilterCount =
    (filters.building ? 1 : 0) +
    (filters.minCapacity ? 1 : 0) +
    filters.equipment.length;

  return (
    <View style={s.page}>
      <Header />

      {/* Search Bar with Cyber Styling */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={20} color={colors.primaryLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={s.searchInput}
            placeholder="Tìm theo tên phòng, tòa nhà..."
            placeholderTextColor={colors.textMuted}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
          onPress={() => setSheet(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? colors.white : colors.primaryLight}
          />
          {activeFilterCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Building Filter Pills */}
      <View style={s.buildingSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.buildingScroll}
        >
          <Pressable
            style={[s.buildingPill, !filters.building && s.buildingPillActive]}
            onPress={() => set('building', null)}
          >
            <Text style={[s.buildingPillText, !filters.building && s.buildingPillTextActive]}>
              Tất cả tòa
            </Text>
          </Pressable>
          {buildings.map((b) => {
            const active = filters.building === b;
            return (
              <Pressable
                key={b}
                style={[s.buildingPill, active && s.buildingPillActive]}
                onPress={() => set('building', active ? null : b)}
              >
                <Text style={[s.buildingPillText, active && s.buildingPillTextActive]}>
                  Tòa {b}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={s.countRow}>
        <Text style={s.countText}>
          Danh sách <Text style={s.countHighlight}>{result.length}</Text> phòng học trực tuyến
        </Text>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={s.loadingText}>Đang đồng bộ dữ liệu phòng...</Text>
        </View>
      ) : (
        <FlatList
          data={result}
          renderItem={({ item }) => <RoomCard room={item} onPress={open} />}
          keyExtractor={(item) => item.id}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: ROOM_CARD_HEIGHT + spacing.md,
            offset: (ROOM_CARD_HEIGHT + spacing.md) * index,
            index,
          })}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="search" size={32} color={colors.primaryLight} />
              </View>
              <Text style={s.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
              <Text style={s.emptySubtitle}>Hãy thử chọn tòa khác hoặc xóa bớt tiêu chí lọc</Text>
              <Pressable style={s.emptyResetBtn} onPress={reset}>
                <Text style={s.emptyResetText}>Đặt lại bộ lọc</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <Filter visible={sheet} close={() => setSheet(false)} reset={reset} />
    </View>
  );
}

function Header() {
  const session = useBookingStore((x) => x.session);
  const initial = session?.studentName?.trim().charAt(0).toUpperCase() || 'U';

  return (
    <View style={s.header}>
      <View>
        <View style={s.brandBadge}>
          <Ionicons name="flash" size={12} color={colors.accent} />
          <Text style={s.brandBadgeText}>VKU SMART CAMPUS</Text>
        </View>
        <Text style={s.greetingText}>
          Xin chào, <Text style={s.nameHighlight}>{session?.studentName?.split(' ').pop() || 'bạn'}</Text> ✨
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mở hồ sơ cá nhân"
        onPress={() => router.push('/profile' as never)}
        style={s.avatarContainer}
      >
        {session?.avatarUrl ? (
          <Image source={{ uri: session.avatarUrl }} style={s.avatarImg} />
        ) : (
          <Text style={s.avatarTxt}>{initial}</Text>
        )}
        <View style={s.onlineDot} />
      </Pressable>
    </View>
  );
}

function Filter({
  visible,
  close,
  reset,
}: {
  visible: boolean;
  close: () => void;
  reset: () => void;
}) {
  const f = useBookingStore((x) => x.filters);
  const set = useBookingStore((x) => x.setFilter);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close}>
        <Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.dragHandle} />

          <View style={s.sheetHeaderRow}>
            <Text style={s.sheetTitle}>Tùy chọn lọc phòng</Text>
            <Pressable onPress={reset}>
              <Text style={s.sheetResetText}>Đặt lại</Text>
            </Pressable>
          </View>

          <Text style={s.filterGroupTitle}>Sức chứa chỗ ngồi</Text>
          <View style={s.filterChipGrid}>
            {[2, 5, 10, 15, 20].map((n) => {
              const active = f.minCapacity === n;
              return (
                <Pressable
                  key={n}
                  style={[s.modalChip, active && s.modalChipActive]}
                  onPress={() => set('minCapacity', active ? null : n)}
                >
                  <Text style={[s.modalChipText, active && s.modalChipTextActive]}>
                    Từ {n} chỗ
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.filterGroupTitle}>Trang thiết bị</Text>
          <View style={s.filterChipGrid}>
            {equipment.map((e) => {
              const active = f.equipment.includes(e);
              const label =
                e === 'HighSpecPC'
                  ? 'PC cấu hình cao'
                  : e === 'Projector'
                  ? 'Máy chiếu'
                  : e === 'Whiteboard'
                  ? 'Bảng viết'
                  : 'Điều hòa';
              return (
                <Pressable
                  key={e}
                  style={[s.modalChip, active && s.modalChipActive]}
                  onPress={() =>
                    set(
                      'equipment',
                      active ? f.equipment.filter((v) => v !== e) : [...f.equipment, e]
                    )
                  }
                >
                  <Text style={[s.modalChipText, active && s.modalChipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={s.applyBtn} onPress={close}>
            <Text style={s.applyBtnText}>Áp dụng bộ lọc</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Bookings({ showQR }: { showQR: (id: string) => void }) {
  const all = useBookingStore((x) => x.bookings);
  const session = useBookingStore((x) => x.session);
  const rooms = useBookingStore((x) => x.rooms);
  const cancel = useBookingStore((x) => x.cancelBooking);
  const complete = useBookingStore((x) => x.completeExpiredBookings);

  useEffect(() => {
    complete();
  }, [complete]);

  const data = useMemo(
    () =>
      all
        .filter((b) => b.userId === session?.userId)
        .sort((a, b) => `${a.date}${a.slot.startTime}`.localeCompare(`${b.date}${b.slot.startTime}`)),
    [all, session]
  );

  return (
    <View style={s.page}>
      <View style={s.bookingHeader}>
        <View style={s.brandBadge}>
          <Ionicons name="time" size={12} color={colors.accent} />
          <Text style={s.brandBadgeText}>VÉ ĐIỆN TỬ</Text>
        </View>
        <Text style={s.bookingTitle}>Phòng của tôi ({data.length})</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(b) => b.id}
        contentContainerStyle={s.bookingListContent}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <View style={s.emptyIconCircle}>
              <Ionicons name="ticket-outline" size={32} color={colors.primaryLight} />
            </View>
            <Text style={s.emptyTitle}>Chưa có lịch đặt phòng</Text>
            <Text style={s.emptySubtitle}>Các phòng bạn đã đặt sẽ hiển thị tại đây dưới dạng thẻ vé QR</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TicketCard
            booking={item}
            room={rooms.find((r) => r.id === item.roomId)}
            showQR={showQR}
            cancel={cancel}
          />
        )}
      />
    </View>
  );
}

function TicketCard({
  booking,
  room,
  showQR,
  cancel,
}: {
  booking: Booking;
  room?: Room;
  showQR: (id: string) => void;
  cancel: (id: string) => Promise<void>;
}) {
  const labels = {
    upcoming: 'Sắp tới',
    'checked-in': 'Đã check-in',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  } as const;

  const statusConfig = {
    upcoming: { bg: colors.primarySoft, text: colors.primaryLight, dot: colors.primaryLight },
    'checked-in': { bg: colors.successSoft, text: colors.success, dot: colors.success },
    completed: { bg: colors.neutralSoft, text: colors.neutral, dot: colors.neutral },
    cancelled: { bg: colors.dangerSoft, text: colors.danger, dot: colors.danger },
  } as const;

  const cfg = statusConfig[booking.status];

  return (
    <View style={s.ticket}>
      {/* Top Ticket Header */}
      <View style={s.ticketTop}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={s.ticketRoomName}>
            {room?.name || 'Phòng học VKU'}
          </Text>
          <Text style={s.ticketLocation}>
            Tòa {room?.building || '--'} · Tầng {room?.floor || '--'} · {room?.capacity || '--'} chỗ ngồi
          </Text>
        </View>

        <View style={[s.ticketStatusBadge, { backgroundColor: cfg.bg }]}>
          <View style={[s.ticketStatusDot, { backgroundColor: cfg.dot }]} />
          <Text style={[s.ticketStatusText, { color: cfg.text }]}>{labels[booking.status]}</Text>
        </View>
      </View>

      {/* Middle Perforated Divider */}
      <View style={s.ticketDividerWrap}>
        <View style={s.ticketNotchLeft} />
        <View style={s.ticketDashedLine} />
        <View style={s.ticketNotchRight} />
      </View>

      {/* Ticket Details & Action */}
      <View style={s.ticketBottom}>
        <View style={s.ticketTimeBlock}>
          <View style={s.ticketTimeItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.accent} />
            <Text style={s.ticketTimeText}>{booking.date}</Text>
          </View>
          <View style={s.ticketTimeItem}>
            <Ionicons name="time-outline" size={14} color={colors.accent} />
            <Text style={s.ticketTimeText}>
              {booking.slot.startTime} – {booking.slot.endTime}
            </Text>
          </View>
        </View>

        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <View style={s.ticketActions}>
            <Pressable
              style={s.qrBtn}
              onPress={() => showQR(booking.id)}
            >
              <Ionicons name="qr-code" size={16} color={colors.white} />
              <Text style={s.qrBtnText}>Mã QR</Text>
            </Pressable>

            {booking.status === 'upcoming' && !past(booking.date, booking.slot) && (
              <Pressable
                style={s.cancelTicketBtn}
                onPress={() =>
                  Alert.alert(
                    'Hủy đặt phòng này?',
                    'Khung giờ sẽ mở lại ngay cho các sinh viên khác.',
                    [
                      { text: 'Quay lại', style: 'cancel' },
                      {
                        text: 'Hủy đặt',
                        style: 'destructive',
                        onPress: () => cancel(booking.id),
                      },
                    ]
                  )
                }
              >
                <Text style={s.cancelTicketText}>Hủy</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function Nav({
  active,
  icon,
  label,
  press,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  press: () => void;
}) {
  return (
    <Pressable style={[s.navItem, active && s.navItemActive]} onPress={press}>
      <Ionicons name={icon} size={19} color={active ? colors.white : colors.textMuted} />
      <Text style={[s.navLabel, active && s.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  brandBadgeText: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  nameHighlight: {
    color: colors.primaryLight,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarTxt: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 18,
  },
  onlineDot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
    right: 0,
    bottom: 0,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  searchBox: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.accent,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '900',
  },
  buildingSection: {
    marginTop: spacing.md,
  },
  buildingScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  buildingPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  buildingPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  buildingPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  buildingPillTextActive: {
    color: colors.white,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  countHighlight: {
    color: colors.accent,
    fontWeight: '800',
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  floatingNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  floatingNavBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 6,
    width: '88%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  navItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  navItemActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  navLabelActive: {
    color: colors.white,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  emptyResetText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderSubtle,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetResetText: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 14,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  filterChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  modalChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalChipTextActive: {
    color: colors.white,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  applyBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  bookingHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  bookingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  bookingListContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 110,
    gap: spacing.md,
  },
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
  },
  ticketTop: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ticketRoomName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ticketLocation: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  ticketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  ticketStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ticketStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ticketDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 18,
  },
  ticketNotchLeft: {
    width: 14,
    height: 18,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: colors.background,
  },
  ticketDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  ticketNotchRight: {
    width: 14,
    height: 18,
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
    backgroundColor: colors.background,
  },
  ticketBottom: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTimeBlock: {
    gap: 4,
  },
  ticketTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  ticketActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  qrBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  cancelTicketBtn: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  cancelTicketText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});
