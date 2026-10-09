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
          bg: "#121416",
          sidebar: "#1b1e22",
          surface: "#202327",
          hover: "#262a2f",
          border: "#2c3136",
          sent: "#2c6bed",
          received: "#262a2f",
          primary: "#FFFFFF",
          secondary: "#8E8E93",
          tertiary: "#636366",
          online: "#4CD964",
          unread: "#2c6bed",
          danger: "#FF453A",
          input: "#202327",
          blue: {
            DEFAULT: "#2c6bed",
            hover: "#1d55d8",
            light: "#60a5fa",
          },
        },
        surface: {
          chat: "#121416",
          card: "#1b1e22",
          sidebar: "#1b1e22",
          header: "#17191c",
          hover: "#262a2f",
          active: "#2c3137",
          input: "#202327",
        },
        border: {
          subtle: "#2c3136",
          strong: "#3d444d",
        },
        text: {
          primary: "#ffffff",
          secondary: "#9aa0a6",
          muted: "#68707a",
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
