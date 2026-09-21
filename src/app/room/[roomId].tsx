import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QRCheckInModal } from '@/components/QRCheckInModal';
import { TIME_SLOTS } from '@/data/mockRooms';
import { useBookingStore } from '@/stores/useBookingStore';
import { Equipment, TimeSlot } from '@/types';
import { colors, radius, spacing } from '@/theme/tokens';

const dates = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date;
});

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const past = (date: string, slot: TimeSlot) => new Date(`${date}T${slot.startTime}:00`) <= new Date();

const equipMeta: Record<Equipment, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  Projector: { icon: 'videocam', label: 'Máy chiếu' },
  Whiteboard: { icon: 'easel', label: 'Bảng viết' },
  HighSpecPC: { icon: 'desktop', label: 'PC cấu hình cao' },
  AC: { icon: 'snow', label: 'Điều hòa' },
};

export default function RoomDetailRoute() {
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const room = useBookingStore((state) => state.rooms.find((item) => item.id === roomId));
  const all = useBookingStore((state) => state.bookings);
  const createBooking = useBookingStore((state) => state.createBooking);
  const checkIn = useBookingStore((state) => state.checkIn);

  const [date, setDate] = useState(iso(dates[0]));
  const [selected, setSelected] = useState<TimeSlot | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const booked = useMemo(
    () => all.filter((booking) => booking.roomId === roomId && booking.date === date),
    [all, roomId, date]
  );

  if (!room) {
    return (
      <View style={styles.missing}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.missingText}>Không tìm thấy phòng học.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  async function confirm() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const result = await createBooking(room!.id, date, selected);
      if ('error' in result) {
        Alert.alert('Không thể đặt phòng', result.error);
        setSelected(null);
        return;
      }
      setQr(result.id);
    } catch {
      Alert.alert('Không thể đặt phòng', 'Không thể kết nối máy chủ Firestore. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  const booking = all.find((item) => item.id === qr) ?? null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Image source={{ uri: room.photoUrl }} style={styles.heroImage} />
          <View style={styles.heroGradient} />

          <Pressable
            style={[styles.backIconBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </Pressable>

          <View style={[styles.heroStatus, { top: insets.top + 10 }]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: room.isCurrentlyAvailable ? colors.success : colors.danger },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: room.isCurrentlyAvailable ? colors.success : colors.danger },
              ]}
            >
              {room.isCurrentlyAvailable ? 'Đang trống' : 'Đang bận'}
            </Text>
          </View>
        </View>

        {/* Room Info */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{room.name}</Text>
              <Text style={styles.location}>
                Tòa {room.building} · Tầng {room.floor} · Không gian VKU
              </Text>
            </View>
            <View style={styles.capacityBadge}>
              <Ionicons name="people" size={16} color={colors.primaryLight} />
              <Text style={styles.capacityText}>{room.capacity} chỗ</Text>
            </View>
          </View>

          {/* Equipment list */}
          <Text style={styles.sectionHeader}>Tiện ích phòng học</Text>
          <View style={styles.equipGrid}>
            {room.equipment.map((item) => {
              const meta = equipMeta[item];
              return (
                <View key={item} style={styles.equipItem}>
                  <Ionicons name={meta.icon} size={16} color={colors.accent} />
                  <Text style={styles.equipLabel}>{meta.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Date Selector */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionHeader}>Chọn ngày học</Text>
            <Text style={styles.selectedDateBadge}>{date}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {dates.map((item) => {
              const key = iso(item);
              const active = date === key;
              return (
                <Pressable
                  key={key}
                  disabled={submitting}
                  style={[styles.dateCard, active && styles.dateCardActive]}
                  onPress={() => {
                    setDate(key);
                    setSelected(null);
                  }}
                >
                  <Text style={[styles.dayName, active && styles.textWhite]}>
                    {item.toLocaleDateString('vi-VN', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dayNumber, active && styles.textWhite]}>
                    {item.getDate()}
                  </Text>
                  <Text style={[styles.monthName, active && styles.textWhite]}>
                    Th {item.getMonth() + 1}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Time Slot Grid */}
          <Text style={styles.sectionHeader}>Khung giờ khả dụng</Text>
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((slot) => {
              const isPast = past(date, slot);
              const isBooked = booked.some(
                (b) => b.slot.id === slot.id && b.status !== 'cancelled'
              );
              const unavailable = submitting || isPast || isBooked;
              const active = selected?.id === slot.id;

              return (
                <Pressable
                  key={slot.id}
                  disabled={unavailable}
                  onPress={() => setSelected(slot)}
                  style={[
                    styles.slotCard,
                    unavailable && styles.slotDisabled,
                    active && styles.slotActive,
                  ]}
                >
                  <View style={styles.slotHeader}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={active ? colors.white : unavailable ? colors.textMuted : colors.primaryLight}
                    />
                    <Text style={[styles.slotTime, active && styles.textWhite]}>
                      {slot.startTime} – {slot.endTime}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.slotStatusPill,
                      active
                        ? styles.slotPillActive
                        : unavailable
                        ? styles.slotPillDisabled
                        : styles.slotPillFree,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotStatusText,
                        active && styles.textWhite,
                        !active && unavailable && styles.textMuted,
                      ]}
                    >
                      {unavailable
                        ? submitting
                          ? 'Đang xử lý'
                          : isPast
                          ? 'Đã qua giờ'
                          : 'Đã có người đặt'
                        : active
                        ? 'Đang chọn'
                        : 'Còn trống'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Booking Confirmation Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(spacing.lg, insets.bottom) }]}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Khung giờ đã chọn</Text>
          <Text style={styles.summaryVal}>
            {selected ? `${selected.startTime} – ${selected.endTime}` : 'Chưa chọn giờ'}
          </Text>
        </View>

        <Pressable
          disabled={!selected || submitting}
          onPress={() => void confirm()}
          style={[styles.confirmBtn, (!selected || submitting) && styles.confirmBtnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Xác nhận đặt</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            </>
          )}
        </Pressable>
      </View>

      <QRCheckInModal booking={booking} room={room} onCheckIn={checkIn} onClose={() => setQr(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    height: 250,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 13, 22, 0.45)',
  },
  backIconBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 27, 46, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  heroStatus: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(19, 27, 46, 0.88)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  location: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  capacityText: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 13,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  equipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  equipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  equipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dateRow: {
    gap: spacing.sm,
  },
  dateCard: {
    width: 64,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 2,
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  monthName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 8,
  },
  slotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  slotDisabled: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    opacity: 0.45,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  slotStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  slotPillFree: {
    backgroundColor: colors.successSoft,
  },
  slotPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  slotPillDisabled: {
    backgroundColor: 'transparent',
  },
  slotStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
  },
  textWhite: {
    color: colors.white,
  },
  textMuted: {
    color: colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  summaryCol: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.pill,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmBtnDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0,
  },
  confirmBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  missingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
});
