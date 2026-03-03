export const ADMIN_FIREBASE_WEB_CONFIG = {
  apiKey: 'AIzaSyCwShBighealpfWc-pw1btYRU7YVmZhl-g',
  authDomain: 'teddycityhotels1.firebaseapp.com',
  projectId: 'teddycityhotels1',
  storageBucket: 'teddycityhotels1.firebasestorage.app',
  messagingSenderId: '207712314730',
  appId: '1:207712314730:web:8acc41a666daf9d7183113',
  measurementId: 'G-RS8VYMEETB',
};

export const ADMIN_FIREBASE_VAPID_KEY = '__FIREBASE_WEB_VAPID_KEY__';

const isPlaceholder = (value: string): boolean =>
  value.startsWith('__') && value.endsWith('__');

export const isFirebasePushConfigured = (): boolean => {
  const values = Object.values(ADMIN_FIREBASE_WEB_CONFIG);
  return (
    values.every((value) => !!value && !isPlaceholder(value)) &&
    !isPlaceholder(ADMIN_FIREBASE_VAPID_KEY)
  );
};
