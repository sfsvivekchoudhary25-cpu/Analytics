/**
 * Soft Pastel Minimal Theme System
 *
 * Official design tokens and reusable styling classes for the
 * "Soft Pastel Minimal" theme.
 */

export const softPastelTheme = {
  name: "Soft Pastel Minimal",
  code: "soft-pastel-minimal",

  // 1. Color Palette Tokens
  colors: {
    // Light Soft Pastels
    periwinkle: "#e2e2fc", // Notes, Ideas, Primary pastel
    butterYellow: "#fff9db", // Tasks, To-Dos, Action items
    rosePink: "#fceef4", // AI Capture, IG Captions
    peachCoral: "#feece4", // Voice Notes, Reminders, Client Notes
    neutralMemo: "#f1f3f7", // General Memos, Notes

    // Accents & Neutrals
    white: "#ffffff",
    black: "#000000",
    textPrimary: "#020617", // slate-950
    textMuted: "#475569", // slate-600
    subtleBorder: "#e9e9ee", // For white cards only
  },

  // 2. Category Color Mappings
  categoryColors: {
    idea: "#e2e2fc",
    todo: "#fff9db",
    instagram_caption: "#fceef4",
    client_note: "#feece4",
    reminder: "#feece4",
    journal: "#f1f3f7",
  },

  // 3. Predefined Standard CSS / Tailwind Classes
  classes: {
    /**
     * Colored card container:
     * IMPORTANT: Must remain borderless!
     */
    coloredCard:
      "rounded-[26px] p-4 text-slate-950 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between cursor-pointer",

    /**
     * Non-colored white card / widget container:
     * Retains subtle border matching website standards.
     */
    whiteWidget:
      "rounded-[24px] border border-[#e9e9ee] hover:border-black/30 bg-white p-5 shadow-2xs transition-all",

    /**
     * White pill badge with crisp dark border
     */
    pillBadge:
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-xs font-bold shadow-2xs",

    /**
     * White square icon container with rounded corners and dark border
     */
    iconSquareBadge:
      "w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0",

    /**
     * Circular black action button with hover scale
     */
    actionCircleButton:
      "w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-transform",

    /**
     * Primary number typography
     */
    statNumber: "text-2xl sm:text-3xl font-black text-slate-950 tabular-nums leading-none",

    /**
     * Card title typography
     */
    cardTitle: "text-xs sm:text-sm font-bold text-slate-950",

    /**
     * Card subtitle typography
     */
    cardSubtitle: "text-[10px] sm:text-xs font-semibold text-slate-600 mt-0.5",
  },
} as const;

export type SoftPastelTheme = typeof softPastelTheme;
