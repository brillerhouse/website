// Briller v1.0.0. Logical units, not physical pixels. Register the Manrope font families first.
// Use allowFontScaling=true. Let text and controls grow; do not cap system accessibility sizes.
// Overlay is 8-digit RGBA hex. Native shadows need per-platform elevation/shadow mapping.
export const briller = {
  "color": {
    "canvas": "#F1F3F4",
    "surface": "#FFFFFF",
    "text": "#202C35",
    "textSecondary": "#586875",
    "accent": "#294B61",
    "accentTint": "#DDE7EC",
    "border": "#CED9E0",
    "onAccent": "#FFFFFF",
    "accentHover": "#203B4D",
    "accentPressed": "#172C3B",
    "controlBorder": "#6F8391",
    "focus": "#2C678B",
    "disabledBackground": "#E5EAED",
    "disabledText": "#586875",
    "success": "#28624A",
    "successTint": "#E8F1EC",
    "warning": "#7A5718",
    "warningTint": "#F7EFDC",
    "danger": "#9F3B3B",
    "dangerTint": "#F8EAEA",
    "info": "#294B61",
    "infoTint": "#DDE7EC",
    "overlay": "#202C3599"
  },
  "space": {
    "s0": 0,
    "s4": 4,
    "s8": 8,
    "s12": 12,
    "s16": 16,
    "s20": 20,
    "s24": 24,
    "s32": 32,
    "s40": 40,
    "s48": 48,
    "s64": 64,
    "s80": 80,
    "s96": 96
  },
  "radius": {
    "control": 6,
    "card": 12,
    "media": 12,
    "dialog": 16,
    "pill": 999
  },
  "size": {
    "control": 48,
    "compactControl": 44,
    "touchTarget": 48,
    "touchTargetIosMinimum": 44,
    "sidebar": 280,
    "contentMax": 1280,
    "articleMax": 720
  },
  "type": {
    "screenTitle": {
      "fontSize": 28,
      "lineHeight": 34,
      "letterSpacing": -0.56,
      "fontFamily": "Manrope-SemiBold"
    },
    "sectionTitle": {
      "fontSize": 22,
      "lineHeight": 30,
      "letterSpacing": -0.22,
      "fontFamily": "Manrope-SemiBold"
    },
    "cardTitle": {
      "fontSize": 18,
      "lineHeight": 26,
      "letterSpacing": 0,
      "fontFamily": "Manrope-SemiBold"
    },
    "body": {
      "fontSize": 16,
      "lineHeight": 24,
      "letterSpacing": 0,
      "fontFamily": "Manrope-Regular"
    },
    "label": {
      "fontSize": 14,
      "lineHeight": 20,
      "letterSpacing": 0,
      "fontFamily": "Manrope-SemiBold"
    },
    "caption": {
      "fontSize": 12,
      "lineHeight": 18,
      "letterSpacing": 0,
      "fontFamily": "Manrope-Medium"
    }
  },
  "motion": {
    "instant": 0,
    "fast": 120,
    "standard": 180,
    "emphasis": 240,
    "easing": "cubic-bezier(0.2, 0, 0, 1)",
    "reduced": 0
  }
} as const;
export type BrillerColor = keyof typeof briller.color;
