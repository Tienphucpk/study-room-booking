import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { registerWithEmail, signInWithEmail, signInWithGoogleIdToken } from '@/services/auth';
import { auth } from '@/services/firebase';
import { syncUserProfile } from '@/services/users';
import { useBookingStore } from '@/stores/useBookingStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');
function getGoogleModule(): GoogleSigninModule | null {
  if (Constants.appOwnership === 'expo') return null;
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

const googleModule = getGoogleModule();
if (googleModule) {
  try {
    googleModule.GoogleSignin.configure({
      webClientId: '175937838374-g0dauoqcmcr6i1kf2rbiejad05tn9f3l.apps.googleusercontent.com',
      iosClientId: '175937838374-tdc95necs67cvt9hq0ssuku8njh2qo32.apps.googleusercontent.com',
    });
  } catch (error) {
    console.warn('[GoogleSignin] configure skipped:', error);
  }
}

function toSession(user: User, role: 'student' | 'admin' = 'student') {
  const fallbackName = user.email?.split('@')[0] ?? 'Sinh viên VKU';
  return {
    userId: user.uid,
    studentName: user.displayName ?? fallbackName,
    studentId: user.email ?? user.uid,
    avatarUrl: user.photoURL ?? undefined,
    isLoggedIn: true,
    role,
  };
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const login = useBookingStore((state) => state.login);
  const logout = useBookingStore((state) => state.logout);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        if (!nextUser) {
          logout();
          return;
        }
        void syncUserProfile(nextUser)
          .then((role) => login(toSession(nextUser, role)))
          .catch(() => login(toSession(nextUser)));
      }),
    [login, logout]
  );

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  return user ? <>{children}</> : <LoginScreen />;
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleGoogleSignIn() {
    const mod = getGoogleModule();
    if (!mod) {
      Alert.alert(
        'Chế độ Expo Go',
        'Google Sign-In yêu cầu Development Build (native). Trên Expo Go, vui lòng sử dụng Đăng nhập hoặc Đăng ký bằng Email & Mật khẩu.'
      );
      return;
    }
    setBusy(true);
    try {
      await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await mod.GoogleSignin.signOut();
      const result = await mod.GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (idToken) await signInWithGoogleIdToken(idToken);
    } catch (error: unknown) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      if (code !== mod.statusCodes?.SIGN_IN_CANCELLED && code !== mod.statusCodes?.IN_PROGRESS) {
        Alert.alert('Đăng nhập Google thất bại', readableError(error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitEmail() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Thông tin chưa hợp lệ', 'Nhập email hợp lệ và mật khẩu ít nhất 6 ký tự.');
      return;
    }
    setBusy(true);
    try {
      if (isRegistering) await registerWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (error) {
      Alert.alert(isRegistering ? 'Không thể tạo tài khoản' : 'Không thể đăng nhập', readableError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="sparkles" size={24} color={colors.white} />
          </View>
          <View>
            <Text style={styles.brand}>VKU SMART CAMPUS</Text>
            <Text style={styles.brandCaption}>HỆ THỐNG ĐẶT PHÒNG TỰ HỌC</Text>
          </View>
        </View>

        <Text style={styles.title}>{isRegistering ? 'Tạo tài khoản mới' : 'Đăng nhập hệ thống'}</Text>
        <Text style={styles.subtitle}>
          {isRegistering
            ? 'Đăng ký nhanh tài khoản sinh viên VKU để đặt phòng học nhóm.'
            : 'Chào mừng quay trở lại. Hãy đăng nhập để kiểm tra lịch học.'}
        </Text>

        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email sinh viên VKU"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            editable={!busy}
          />
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            editable={!busy}
          />
        </View>

        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void submitEmail()}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.primaryText}>
                {isRegistering ? 'Xác nhận Đăng ký' : 'Đăng nhập'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>HOẶC TIẾP TỤC VỚI</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={[styles.google, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void handleGoogleSignIn()}
        >
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text style={styles.googleText}>Đăng nhập với Google</Text>
        </Pressable>

        <Pressable disabled={busy} onPress={() => setIsRegistering((value) => !value)}>
          <Text style={styles.switchText}>
            {isRegistering ? 'Đã có tài khoản?  Đăng nhập tại đây' : 'Chưa có tài khoản?  Đăng ký ngay'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function readableError(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = String(error.code);
    if (code.includes('invalid-credential')) return 'Email hoặc mật khẩu không chính xác.';
    if (code.includes('email-already-in-use')) return 'Email này đã được đăng ký.';
    if (code.includes('network-request-failed')) return 'Không thể kết nối mạng.';
    if (code.includes('play-services-not-available'))
      return 'Google Play Services không khả dụng hoặc cần cập nhật.';
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  orbOne: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    top: -120,
    right: -90,
  },
  orbTwo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    bottom: -90,
    left: -90,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    elevation: 12,
    shadowColor: colors.primaryGlow,
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  brand: {
    color: colors.primaryLight,
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 14,
  },
  brandCaption: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  input: {
    flex: 1,
    paddingLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: 15,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  google: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
  },
  googleText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  switchText: {
    textAlign: 'center',
    color: colors.primaryLight,
    fontWeight: '700',
    marginTop: spacing.xs,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
});
