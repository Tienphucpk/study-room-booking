import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addRoom } from '@/services/admin';
import { seedRoomsIfEmpty } from '@/services/rooms';
import { useBookingStore } from '@/stores/useBookingStore';
import { Building, Equipment } from '@/types';
import { colors, radius, spacing } from '@/theme/tokens';

const buildings: Building[] = ['A', 'B', 'C', 'V'];
const equipment: Equipment[] = ['Projector', 'Whiteboard', 'HighSpecPC', 'AC'];

const equipLabels: Record<Equipment, string> = {
  Projector: 'Máy chiếu',
  Whiteboard: 'Bảng viết',
  HighSpecPC: 'PC mạnh',
  AC: 'Điều hòa',
};

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const role = useBookingStore((state) => state.session?.role);
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('1');
  const [capacity, setCapacity] = useState('20');
  const [photoUrl, setPhotoUrl] = useState('');
  const [building, setBuilding] = useState<Building>('A');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  if (role !== 'admin') {
    return (
      <View style={styles.denied}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.danger} />
        <Text style={styles.deniedTitle}>Không có quyền quản trị</Text>
        <Text style={styles.note}>Chỉ tài khoản có vai trò admin mới truy cập được.</Text>
        <Pressable style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const toggleEquipment = (item: Equipment) =>
    setSelectedEquipment((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );

  async function save() {
    const parsedFloor = Number(floor);
    const parsedCapacity = Number(capacity);
    if (
      !name.trim() ||
      !Number.isInteger(parsedFloor) ||
      parsedFloor < 1 ||
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < 2 ||
      parsedCapacity > 20
    ) {
      Alert.alert('Dữ liệu chưa hợp lệ', 'Tên phòng, tầng và sức chứa (2–20 chỗ) là bắt buộc.');
      return;
    }
    setSaving(true);
    try {
      await addRoom({
        name: name.trim(),
        building,
        floor: parsedFloor,
        capacity: parsedCapacity,
        equipment: selectedEquipment,
        photoUrl:
          photoUrl.trim() ||
          `https://picsum.photos/seed/${encodeURIComponent(name.trim())}/800/500`,
      });
      Alert.alert('Đã thêm phòng', 'Phòng mới đã đồng bộ theo thời gian thực.');
      setName('');
      setPhotoUrl('');
      setFloor('1');
      setCapacity('20');
      setSelectedEquipment([]);
    } catch {
      Alert.alert('Không thể thêm phòng', 'Kiểm tra Firestore Rules và quyền admin của tài khoản.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedRoomsIfEmpty();
      Alert.alert('Hoàn tất', 'Đã kiểm tra và nạp danh mục phòng mẫu nếu dữ liệu trống.');
    } catch {
      Alert.alert('Lỗi', 'Không thể nạp dữ liệu. Vui lòng thử lại.');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <ScrollView
      style={[styles.page, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.top}>
        <Pressable disabled={saving} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Quản lý phòng học</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.note}>
        Thêm phòng học mới vào danh mục VKU Campus. Dữ liệu sẽ đồng bộ thời gian thực tới tất cả sinh viên.
      </Text>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Tên phòng học</Text>
        <TextInput
          editable={!saving}
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: A101, B204..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Tòa nhà</Text>
        <View style={styles.row}>
          {buildings.map((item) => (
            <Pressable
              key={item}
              style={[styles.chip, building === item && styles.chipOn]}
              onPress={() => !saving && setBuilding(item)}
            >
              <Text style={[styles.chipText, building === item && styles.chipTextOn]}>
                Tòa {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Tầng</Text>
            <TextInput
              editable={!saving}
              value={floor}
              onChangeText={setFloor}
              placeholder="1"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Sức chứa (2-20)</Text>
            <TextInput
              editable={!saving}
              value={capacity}
              onChangeText={setCapacity}
              placeholder="20"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>URL ảnh đại diện (Tùy chọn)</Text>
        <TextInput
          editable={!saving}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Trang thiết bị</Text>
        <View style={styles.row}>
          {equipment.map((item) => (
            <Pressable
              key={item}
              style={[styles.chip, selectedEquipment.includes(item) && styles.chipOn]}
              onPress={() => !saving && toggleEquipment(item)}
            >
              <Text style={[styles.chipText, selectedEquipment.includes(item) && styles.chipTextOn]}>
                {equipLabels[item]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.save, saving && styles.disabled]}
          disabled={saving}
          onPress={() => void save()}
        >
          {saving ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.saveText}>Đang lưu phòng...</Text>
            </View>
          ) : (
            <Text style={styles.saveText}>Thêm phòng mới</Text>
          )}
        </Pressable>
      </View>

      {/* Utilities Card */}
      <View style={[styles.card, { marginTop: spacing.md }]}>
        <Text style={styles.label}>Công cụ tiện ích</Text>
        <Pressable
          style={[styles.seedBtn, seeding && styles.disabled]}
          disabled={seeding}
          onPress={() => void handleSeed()}
        >
          {seeding ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={18} color={colors.primary} />
              <Text style={styles.seedBtnText}>Nạp danh mục phòng mẫu (Seed Data)</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 20,
  },
  note: {
    color: colors.textMuted,
    lineHeight: 18,
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginTop: spacing.xs,
  },
  input: {
    minHeight: 48,
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextOn: {
    color: colors.white,
  },
  save: {
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.primarySoft,
  },
  seedBtnText: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 13,
  },
  disabled: {
    opacity: 0.55,
  },
  denied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  backPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  backPillText: {
    color: colors.white,
    fontWeight: '700',
  },
});
