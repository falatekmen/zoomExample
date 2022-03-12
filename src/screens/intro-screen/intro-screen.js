import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import {
  checkMultiple,
  requestMultiple,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';


const platformPermissions = {
  ios: [
    PERMISSIONS.IOS.MICROPHONE,
  ],
  android: [
    PERMISSIONS.ANDROID.RECORD_AUDIO,
  ],
};

export function IntroScreen({ navigation }) {

  useEffect(() => {
    const permissions = platformPermissions[Platform.OS];
    let blockedAny = false;
    let notGranted = [];

    checkMultiple(permissions).then(
      (statuses) => {
        permissions.map((p) => {
          const status = statuses[p];
          if (status === RESULTS.BLOCKED) {
            blockedAny = true;
          } else if (status !== RESULTS.GRANTED) {
            notGranted.push(p);
          }
        });
        notGranted.length && requestMultiple(notGranted);
        blockedAny && openSettings();
      }
    );

    navigation.navigate('Join')
  }, []);

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }} />
  );
}