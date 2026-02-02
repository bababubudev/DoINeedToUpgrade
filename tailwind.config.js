/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [{
      light: {
        "primary": "#3B82F6",
        "primary-content": "#FFFFFF",
        "secondary": "#6366F1",
        "secondary-content": "#FFFFFF",
        "accent": "#0EA5E9",
        "accent-content": "#FFFFFF",
        "neutral": "#1F2937",
        "neutral-content": "#F9FAFB",
        "base-100": "#FFFFFF",
        "base-200": "#F0F2F5",
        "base-300": "#E5E7EB",
        "base-content": "#1A1D23",
        "info": "#3B82F6",
        "success": "#22C55E",
        "warning": "#F59E0B",
        "error": "#EF4444",
      }
    }, {
      dark: {
        "primary": "#60A5FA",
        "primary-content": "#FFFFFF",
        "secondary": "#818CF8",
        "secondary-content": "#FFFFFF",
        "accent": "#38BDF8",
        "accent-content": "#FFFFFF",
        "neutral": "#374151",
        "neutral-content": "#D1D5DB",
        "base-100": "#242B33",
        "base-200": "#1A1F26",
        "base-300": "#3B4451",
        "base-content": "#E5E7EB",
        "info": "#60A5FA",
        "success": "#4ADE80",
        "warning": "#FBBF24",
        "error": "#F87171",
      }
    }],
  },
};
