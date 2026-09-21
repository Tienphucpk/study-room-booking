import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '@/theme/tokens';
import { requestNotificationPermissions } from '@/utils/notifications';

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && width > 520;

  useEffect(() => {
    if (Constants.appOwnership !== 'expo' && !isWeb) {
      void import('expo-notifications').then((Notifications) =>
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        })
      );
    }
    void requestNotificationPermissions().catch(() => undefined);
  }, [isWeb]);

  const frameWidth = Math.min(width - 32, 440);
  const frameHeight = Math.min(height - 40, 920);

  return (
    <View style={isDesktopWeb ? styles.desktopOuter : styles.fullScreen}>
      {isDesktopWeb && <View style={styles.desktopAuraTop} />}
      <View
        style={
          isDesktopWeb
            ? [
                styles.phoneFrame,
                {
                  width: frameWidth,
                  height: frameHeight,
                },
              ]
            : styles.fullScreen
        }
      >
        {isDesktopWeb && (
          <View style={styles.islandContainer} pointerEvents="none">
            <View style={styles.dynamicIsland} />
          </View>
        )}
        <StatusBar style="light" />
        <View style={styles.contentWrap}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          />
        </View>
      </View>
      {isDesktopWeb && (
        <View style={styles.desktopFooter}>
          <Text style={styles.desktopFooterText}>
            VKU SMART CAMPUS · HỆ THỐNG ĐẶT PHÒNG HỌC NHÓM
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  desktopOuter: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#040711',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  desktopAuraTop: {
    position: 'absolute',
    width: 650,
    height: 650,
    borderRadius: 325,
    backgroundColor: 'rgba(124, 58, 237, 0.09)',
    top: -200,
  },
  phoneFrame: {
    backgroundColor: colors.background,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: '#1E293B',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
  },
  islandContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  dynamicIsland: {
    width: 96,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000',
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  desktopFooter: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
  },
  desktopFooterText: {
    color: '#475569',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});

