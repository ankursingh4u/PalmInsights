// Design tokens — clean, light, minimal. One purple accent, lots of whitespace.

export const colors = {
  bg: "#F7F6FB", // soft off-white
  bgElevated: "#FFFFFF",
  card: "#FFFFFF",
  cardBorder: "#EAE8F2",
  chipBg: "#F2F1F8", // subtle neutral fill (icon chips, ghost buttons)
  cosmicSoft: "#F3EDFE", // light purple tint (accent surfaces)
  cosmicSoftBorder: "#E6DBFC",
  overlay: "rgba(247,246,251,0.90)",

  text: "#1B1726", // ink
  textDim: "#6A6480",
  textFaint: "#9A94AC",

  // one accent
  cosmic: "#7C3AED",
  cosmic300: "#7C3AED", // used as "active"/accent — kept strong for light bg
  cosmic400: "#8B5CF6",
  cosmic600: "#6D28D9",

  // palm line colors (tuned for contrast on light)
  life: "#e11d48",
  heart: "#2563eb",
  head: "#d97706",
  fate: "#16a34a",

  danger: "#dc2626",
  success: "#16a34a",
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 12, md: 18, lg: 24, full: 999 };
export const font = {
  h1: 30,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

// Soft, minimal elevation for cards on the light background.
export const shadow = {
  shadowColor: "#1B1726",
  shadowOpacity: 0.05,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
  elevation: 2,
};
