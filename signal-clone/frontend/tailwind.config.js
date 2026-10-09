/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        signal: {
          // Main backgrounds
          bg: "#1B1B1B",
          sidebar: "#2A2A2A",
          surface: "#3A3A3A",
          hover: "#333333",
          border: "#3D3D3D",
          // Bubbles
          sent: "#3A76F0",
          received: "#2C2C2E",
          // Text
          primary: "#FFFFFF",
          secondary: "#8E8E93",
          tertiary: "#636366",
          // Accents
          online: "#4CD964",
          unread: "#3A76F0",
          danger: "#FF453A",
          // Input
          input: "#1C1C1E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "typing-dot": "typingDot 1.4s infinite ease-in-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        typingDot: {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};
