import { Alert, Platform } from 'react-native';

// React Native Web's Alert.alert ignores the buttons array entirely — only the
// single-button (title + message) form works. So delete confirmations on web
// silently dropped the destructive callback. These helpers route to native
// browser dialogs on web and to Alert.alert on iOS / Android.

export function showInfo(message: string, title?: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Defer one tick so a closing Modal doesn't eat the alert.
    setTimeout(() => window.alert(title ? `${title}\n\n${message}` : message), 0);
    return;
  }
  if (title) Alert.alert(title, message);
  else Alert.alert(message);
}

export function confirmAction(opts: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(`${opts.title}\n\n${opts.message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(opts.title, opts.message, [
      { text: opts.cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: opts.confirmLabel,
        style: opts.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
