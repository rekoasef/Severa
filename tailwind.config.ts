import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // --- Aquí añadimos nuestra configuración ---
      colors: {
        primary: "#2A9D8F",
        accent: "#E76F51",
        text: "#264653",
        background: "#F4F4F4",
        card: "#FFFFFF",
      },
      fontFamily: {
        heading: ["var(--font-poppins)"],
        body: ["var(--font-inter)"],
      },
      // -----------------------------------------
    },
  },
  plugins: [],
};
export default config;