// App-wide design tokens. Restaurant-warm palette: terracotta primary,
// cream background, soft amber accent. Used in our screens (the scaffold's
// constants/theme.ts is left alone for the navigation theme).

export const theme = {
  colors: {
    primary: '#c8553d',       // terracotta — buttons, prices, active states
    primaryDark: '#a04230',   // pressed
    primarySoft: '#fbe9e3',   // tinted backgrounds
    accent: '#f0b955',        // amber — secondary highlights
    bg: '#faf6f0',            // warm cream — screen background
    card: '#ffffff',          // card surface
    border: '#ece4d6',        // subtle warm border
    text: '#2a2118',          // near-black, warm
    muted: '#807466',         // secondary text
    danger: '#a8341c',
    success: '#3c7a3a',
  },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  shadow: {
    card: {
      shadowColor: '#3a2a1a',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    fab: {
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 8,
    },
  },
  // Cap layout width on web so the desktop view doesn't sprawl across the screen.
  webMaxWidth: 760,
};

export type Theme = typeof theme;
