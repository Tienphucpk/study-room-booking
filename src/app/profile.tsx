import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/AuthGate';
import { signOutUser } from '@/services/auth';
import { auth } from '@/services/firebase';
import { useBookingStore } from '@/stores/useBookingStore';
import { colors, radius, spacing } from '@/theme/tokens';

export default function ProfileRoute() {
  return (
    <AuthGate>
      <ProfileScreen />
    </AuthGate>
  );
}

function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const session = useBookingStore((state) => state.session);
  const login = useBookingStore((state) => state.login);
  const logout = useBookingStore((state) => state.logout);
  const [name, setName] = useState(session?.studentName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(session?.studentName ?? ''), [session?.studentName]);

  if (!user || !session) return null;
  const firebaseUser = user;
  const activeSession = session;
  const initial = name.trim().charAt(0).toUpperCase() || 'U';

  async function save() {
    const displayName = name.trim();
    if (!displayName) {
      Alert.alert('Tên chưa hợp lệ', 'Vui lòng nhập tên hiển thị.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(firebaseUser, { displayName });
      login({
        ...activeSession,
        studentName: displayName,
        avatarUrl: firebaseUser.photoURL ?? undefined,
      });
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.');
    } catch {
      Alert.alert('Không thể lưu hồ sơ', 'Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOutUser();
      logout();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  function confirmSignOut() {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Bạn có chắc chắn muốn đăng xuất?') : true;
      if (ok) {
        void handleSignOut();
      }
      return;
    }

    Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để sử dụng tính năng đặt phòng.', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => void handleSignOut(),
      },
    ]);
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topbarTitle}>Hồ sơ cá nhân</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Banner */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {session.avatarUrl ? (
              <Image source={{ uri: session.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
            <View style={styles.verifiedIconWrap}>
              <Ionicons name="shield-checkmark" size={13} color={colors.white} />
            </View>
          </View>

          <Text style={styles.name}>{session.studentName}</Text>
          <Text style={styles.email}>{session.studentId}</Text>

          <View style={styles.rolePill}>
            <Text style={styles.roleText}>
              {session.role === 'admin' ? 'Tài khoản Quản trị viên' : 'Sinh viên VKU'}
            </Text>
          </View>
        </View>

        {/* Edit Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <Text style={styles.label}>Tên hiển thị</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Tên của bạn"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Text style={styles.label}>Email tài khoản</Text>
          <View style={[styles.inputWrap, styles.readonly]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <Text style={styles.emailValue}>{session.studentId}</Text>
          </View>

          <Pressable
            style={[styles.saveBtn, saving && styles.disabled]}
            disabled={saving}
            onPress={() => void save()}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
            )}
          </Pressable>
        </View>

        {/* Admin Link Section */}
        {session.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quyền quản trị</Text>
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push('/admin' as never)}
            >
              <View style={styles.menuIconBg}>
                <Ionicons name="business" size={18} color={colors.primaryLight} />
              </View>
              <Text style={[styles.menuRowText, { color: colors.primaryLight }]}>
                Thêm và quản lý phòng học
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primaryLight} />
            </Pressable>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <Pressable style={styles.menuRow} onPress={confirmSignOut}>
            <View style={[styles.menuIconBg, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            </View>
            <Text style={[styles.menuRowText, { color: colors.danger }]}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topbar: {
    height: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  backBtnPlaceholder: {
    width: 38,
    height: 38,
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  avatarText: {
    color: colors.primaryLight,
    fontSize: 32,
    fontWeight: '800',
  },
  verifiedIconWrap: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  rolePill: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  roleText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSubtle,
  },
  readonly: {
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    paddingLeft: spacing.sm,
    fontSize: 14,
  },
  emailValue: {
    color: colors.textMuted,
    paddingLeft: spacing.sm,
    flex: 1,
    fontSize: 14,
  },
  saveBtn: {
    minHeight: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});
