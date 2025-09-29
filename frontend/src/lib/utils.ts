import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Qatar theme specific utilities
export const qatarTheme = {
  colors: {
    maroon: "#8B1538",
    white: "#FFFFFF",
    gold: "#FFD700",
    lightMaroon: "#8B1538",
    darkMaroon: "#6B0F28",
  },
  gradients: {
    primary: "from-qatar-maroon to-qatar-maroon/90",
    secondary: "from-qatar-gold/10 to-qatar-gold/5",
    card: "from-white via-qatar-gold/5 to-qatar-maroon/5",
  },
};

// Utility for RTL support
export function rtl(isRTL: boolean, rtlClass: string, ltrClass: string = "") {
  return isRTL ? rtlClass : ltrClass;
}

// Generate hierarchy level styles
export function getHierarchyLevelStyle(level: number) {
  const styles = [
    "bg-gradient-to-br from-qatar-maroon to-qatar-maroon/90 text-white", // Prime Minister
    "bg-gradient-to-br from-qatar-maroon/80 to-qatar-maroon/70 text-white", // Ministers
    "bg-gradient-to-br from-white to-qatar-gold/10 border-2 border-qatar-maroon/30", // Directors
    "bg-white border border-qatar-maroon/20", // Departments
    "bg-gray-50 border border-gray-300", // Sub-departments
  ];
  return styles[Math.min(level, styles.length - 1)];
}