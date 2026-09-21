import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Equipment, Room } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/tokens';

interface Props {
  room: Room;
  onPress: (id: string) => void;
}

const equipmentIcons: Record<Equipment, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  Projector: { icon: 'videocam-outline', label: 'Máy chiếu' },
  Whiteboard: { icon: 'easel-outline', label: 'Bảng' },
  HighSpecPC: { icon: 'desktop-outline', label: 'PC mạnh' },
  AC: { icon: 'snow-outline', label: 'Điều hòa' },
};

function RoomCardBase({ room, onPress }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(room.id)}
    >
      <View style={styles.imageContainer}>
        {imageFailed ? (
          <View style={styles.placeholder}>
            <Ionicons name="business" size={32} color={colors.textMuted} />
          </View>
        ) : (
          <Image
            source={{ uri: room.photoUrl }}
            style={styles.image}
            onError={() => setImageFailed(true)}
          />
        )}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: room.isCurrentlyAvailable ? 'rgba(16, 185, 129, 0.95)' : 'rgba(244, 63, 94, 0.95)' },
          ]}
        >
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{room.isCurrentlyAvailable ? 'Sẵn sàng' : 'Đang bận'}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={styles.name}>
            {room.name}
          </Text>
          <View style={styles.buildingTag}>
            <Text style={styles.buildingTagText}>Tòa {room.building}</Text>
          </View>
        </View>

        <Text style={styles.floorText}>
          Tầng {room.floor} · Khu tự học VKU
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.capacityBadge}>
            <Ionicons name="people" size={13} color={colors.primaryLight} />
            <Text style={styles.capacityText}>{room.capacity} chỗ</Text>
          </View>

          <View style={styles.equipmentRow}>
            {room.equipment.slice(0, 3).map((item) => {
              const meta = equipmentIcons[item];
              return (
                <View key={item} style={styles.equipChip}>
                  <Ionicons name={meta.icon} size={13} color={colors.accent} />
                </View>
              );
            })}
            {room.equipment.length > 3 && (
              <View style={styles.equipChip}>
                <Text style={styles.moreEquipText}>+{room.equipment.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function areEqual(previous: Props, next: Props) {
  return (
    previous.room.id === next.room.id &&
    previous.room.isCurrentlyAvailable === next.room.isCurrentlyAvailable &&
    previous.room.name === next.room.name &&
    previous.onPress === next.onPress
  );
}

export const RoomCard = React.memo(RoomCardBase, areEqual);
export const ROOM_CARD_HEIGHT = 146;

const styles = StyleSheet.create({
  card: {
    height: ROOM_CARD_HEIGHT,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    width: 126,
    height: '100%',
    position: 'relative',
    backgroundColor: colors.surfaceSubtle,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  info: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  buildingTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  buildingTagText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
  },
  floorText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  capacityText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  equipChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  moreEquipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
  },
});
