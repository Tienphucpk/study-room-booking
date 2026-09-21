import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Booking, Room } from '@/types';
import { checkInOpensAt, getCheckInWindow } from '@/utils/checkIn';
import { colors, radius, spacing } from '@/theme/tokens';

export function QRCheckInModal({
  booking,
  room,
  onClose,
  onCheckIn,
}: {
  booking: Booking | null;
  room?: Room;
  onClose: () => void;
  onCheckIn?: (id: string) => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  if (!booking || !room) return null;

  const checkInWindow = getCheckInWindow(booking, now);
  const opensAt = checkInOpensAt(booking).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const canCheckIn = booking.status === 'upcoming' && checkInWindow === 'open';

  const statusMessage =
    booking.status === 'checked-in'
      ? 'Bạn đã hoàn tất check-in phòng thành công!'
      : checkInWindow === 'too-early'
      ? `Cổng check-in sẽ mở lúc ${opensAt} (trước 15 phút).`
      : checkInWindow === 'closed'
      ? 'Khung giờ này đã kết thúc, không thể check-in.'
      : 'Cổng check-in đang mở. Vui lòng bấm xác nhận bên dưới.';

  const isCheckedIn = booking.status === 'checked-in';

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.headerBadge,
                isCheckedIn ? styles.badgeSuccess : styles.badgePrimary,
              ]}
            >
              <Ionicons
                name={isCheckedIn ? 'checkmark-circle' : 'qr-code'}
                size={14}
                color={isCheckedIn ? colors.success : colors.primaryLight}
              />
              <Text
                style={[
                  styles.headerBadgeText,
                  isCheckedIn ? styles.textSuccess : styles.textPrimary,
                ]}
              >
                {isCheckedIn ? 'ĐÃ CHECK-IN' : 'VÉ CHECK-IN ĐIỆN TỬ'}
              </Text>
            </View>
          </View>

          <Text style={styles.roomTitle}>{room.name}</Text>
          <Text style={styles.roomSubtitle}>
            Tòa {room.building} · Tầng {room.floor} · {booking.date}
          </Text>
          <Text style={styles.timeText}>
            {booking.slot.startTime} – {booking.slot.endTime}
          </Text>

          {/* QR Code Container with High-contrast background for Scanner */}
          <View style={styles.qrContainer}>
            <View style={styles.qrInner}>
              <QRCode value={booking.qrCode} size={180} color="#000000" />
            </View>
          </View>

          {/* Status Alert Banner */}
          <View
            style={[
              styles.noticeBox,
              isCheckedIn
                ? styles.noticeSuccess
                : checkInWindow === 'open'
                ? styles.noticeOpen
                : checkInWindow === 'closed'
                ? styles.noticeClosed
                : styles.noticeEarly,
            ]}
          >
            <Ionicons
              name={
                isCheckedIn || checkInWindow === 'open'
                  ? 'checkmark-circle-outline'
                  : checkInWindow === 'closed'
                  ? 'close-circle-outline'
                  : 'time-outline'
              }
              size={18}
              color={
                isCheckedIn || checkInWindow === 'open'
                  ? colors.success
                  : checkInWindow === 'closed'
                  ? colors.danger
                  : colors.warning
              }
            />
            <Text style={styles.noticeText}>{statusMessage}</Text>
          </View>

          {/* Actions */}
          {booking.status === 'upcoming' && onCheckIn && (
            <Pressable
              disabled={!canCheckIn}
              style={[styles.checkInBtn, !canCheckIn && styles.checkInBtnDisabled]}
              onPress={() => onCheckIn(booking.id)}
            >
              <Ionicons name="checkmark-done-circle" size={20} color={colors.white} />
              <Text style={styles.btnText}>
                {canCheckIn
                  ? 'Xác nhận Check-in ngay'
                  : checkInWindow === 'too-early'
                  ? 'Chưa đến giờ check-in'
                  : 'Đã hết giờ check-in'}
              </Text>
            </Pressable>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Đóng cửa sổ</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderSubtle,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  badgeRow: {
    marginBottom: spacing.xs,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgePrimary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  badgeSuccess: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  textPrimary: {
    color: colors.primaryLight,
  },
  textSuccess: {
    color: colors.success,
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  roomSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  timeText: {
    fontSize: 13,
    color: colors.accent,
    marginTop: 2,
    fontWeight: '700',
  },
  qrContainer: {
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    shadowColor: colors.primaryLight,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  qrInner: {
    padding: 6,
    backgroundColor: colors.white,
  },
  noticeBox: {
    width: '100%',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  noticeEarly: {
    backgroundColor: colors.warningSoft,
  },
  noticeOpen: {
    backgroundColor: colors.successSoft,
  },
  noticeSuccess: {
    backgroundColor: colors.successSoft,
  },
  noticeClosed: {
    backgroundColor: colors.dangerSoft,
  },
  noticeText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  checkInBtn: {
    backgroundColor: colors.success,
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.success,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  checkInBtnDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0,
  },
  btnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
