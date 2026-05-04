// Per-deployment restaurant config. Edit these values for the tablet you're shipping.
// (Things that change between locations live here; things that change per-render live in i18n.)

export const restaurantConfig = {
  name: 'LATAKIA',
  // Shown on the printed invoice header, in both languages.
  invoiceHeader: {
    ar: 'مطعم اللاذقية',
    nl: 'Restaurant Latakia',
  },
  address: '',
  phone: '',
  // ISO 4217 code used for Intl.NumberFormat
  currency: 'EUR',
};

export const APP_CONFIG = {
  defaultLanguage: 'nl' as 'nl' | 'ar',
  // Read from EXPO_PUBLIC_ADMIN_PIN at build time. Inlined into the bundle.
  adminPin: process.env.EXPO_PUBLIC_ADMIN_PIN ?? '1234',
};
