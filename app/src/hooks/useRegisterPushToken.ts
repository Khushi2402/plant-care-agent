import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { registerDeviceToken } from '../lib/supabase-queries';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useRegisterPushToken() {
  useEffect(() => {
    async function register() {
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device — skipping on simulator.');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted.');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      try {
        await registerDeviceToken(tokenData.data);
        console.log('Push token registered:', tokenData.data);
      } catch (e) {
        console.error('Failed to save push token', e);
      }
    }

    // Handle the case where the app was fully closed and opened by tapping a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        router.push('/notifications');
      }
    });

    register();

    // Handle taps while the app is open or backgrounded
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/notifications');
    });

    return () => subscription.remove();
  }, []);
}