import { Fraunces, DM_Sans } from "next/font/google";

// Warm, characterful display serif for headlines — replaces the previous
// technical/geometric Space Grotesk used across the marketing homepage.
export const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

// Clean, legible body text.
export const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
