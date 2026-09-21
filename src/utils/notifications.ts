import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Booking, Room } from '@/types';

function unavailableInExpoGo(): boolean {
  return Platform.OS === 'web' || Constants.appOwnership === 'expo';
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (unavailableInExpoGo()) {
    if (Constants.appOwnership === 'expo') console.warn('[Notifications] Expo Go does not support this native notification flow. Use a development build to test reminders.');
    return false;
  }
  try {
    const Notifications = await import('expo-notifications');
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('booking-reminders', { name: 'Booking reminders', importance: Notifications.AndroidImportance.HIGH });
    const current = await Notifications.getPermissionsAsync();
    const status = current.status === 'granted' ? current.status : (await Notifications.requestPermissionsAsync()).status;
    return status === 'granted';
  } catch (error) { console.warn('[VKU Booking] Unable to request notification permissions', error); return false; }
}

export async function scheduleCheckInNotification(booking: Booking, room: Room): Promise<string | undefined> {
  if (unavailableInExpoGo()) return undefined;
  try {
    const triggerAt = new Date(`${booking.date}T${booking.slot.startTime}:00`); triggerAt.setMinutes(triggerAt.getMinutes() - 15);
    if (triggerAt <= new Date() || !(await requestNotificationPermissions())) return undefined;
    const Notifications = await import('expo-notifications');
    return Notifications.scheduleNotificationAsync({ content: { title: 'Sắp đến giờ đặt phòng!', body: `Phòng ${room.name} - còn 15 phút nữa (${booking.slot.startTime})`, data: { bookingId: booking.id } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt } });
  } catch (error) { console.warn('[VKU Booking] Unable to schedule reminder', error); return undefined; }
}

export async function cancelCheckInNotification(notificationId: string): Promise<void> {
  if (unavailableInExpoGo()) return;
  try { const Notifications = await import('expo-notifications'); await Notifications.cancelScheduledNotificationAsync(notificationId); }
  catch (error) { console.warn('[VKU Booking] Unable to cancel reminder', error); }
}
