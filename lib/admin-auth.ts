import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { APP_CONFIG } from './config';

// Auth state lives in memory — closing/refreshing re-prompts. Right behavior
// for a shared tablet.
//
// The actual PIN is loaded from AsyncStorage at startup (see initAdminAuth);
// `EXPO_PUBLIC_ADMIN_PIN` from .env is the *factory default* used until the
// admin changes it from the dashboard. Once changed, the AsyncStorage value
// wins forever (until cleared).
const STORAGE_KEY = 'latakia.adminPin';

type AdminAuthState = {
  authenticated: boolean;
  currentPin: string;
  ready: boolean;
  init: () => Promise<void>;
  tryPin: (pin: string) => boolean;
  changePin: (newPin: string) => Promise<void>;
  logout: () => void;
};

export const useAdminAuth = create<AdminAuthState>((set, get) => ({
  authenticated: false,
  currentPin: APP_CONFIG.adminPin,
  ready: false,
  init: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && /^\d{4}$/.test(stored)) {
        set({ currentPin: stored, ready: true });
        return;
      }
    } catch {}
    set({ ready: true });
  },
  tryPin: (pin) => {
    const ok = pin === get().currentPin;
    if (ok) set({ authenticated: true });
    return ok;
  },
  changePin: async (newPin) => {
    if (!/^\d{4}$/.test(newPin)) throw new Error('PIN must be 4 digits');
    await AsyncStorage.setItem(STORAGE_KEY, newPin);
    set({ currentPin: newPin });
  },
  logout: () => set({ authenticated: false }),
}));
