import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { colors } from '@/theme/tokens';
import { requestNotificationPermissions } from '@/utils/notifications';

export default function RootLayout() {
  useEffect(() => {
    if (Constants.appOwnership !== 'expo') {
      void import('expo-notifications').then((Notifications) => Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
      }));
    }
    void requestNotificationPermissions().catch(() => undefined);
  }, []);
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
    </>
  );
}

