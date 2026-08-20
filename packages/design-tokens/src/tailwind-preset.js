/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: "#FAF9F6",
        surface: "#FFFFFF",
        "text-primary": "#2A2C30",
        "text-secondary": "#565A62",
        "text-muted": "#8A8F97",
        border: "#E5E2DA",
        "border-alt": "#EEEBE3",
        success: "#3E9E63",
        "success-tint": "#E9F7EE",
        danger: "#C74747",
        "danger-tint": "#FCEAEA",
        brand: "#FFC629",
        "brand-link": "#C98A00",
        "brand-link-hover": "#E3A400",
        "brand-pending": "#B07A00",
        "dark-pill": "#2A2C30",
        "tint-gold": "#FFF3D6",
        "tint-blue": "#E7F0F7",
        "tint-pink": "#F7EAF0",
        "tint-green": "#E9F7EE",
      },
      fontFamily: {
        // var(--font-display/body) are supplied by next/font in each app's layout;
        // the literal names are a fallback for any surface not using next/font.
        display: ["var(--font-display)", "Fredoka", "sans-serif"],
        body: ["var(--font-body)", "Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "100px",
        "card-lg": "18px",
        card: "14px",
        chip: "10px",
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.1)",
        dropdown: "0 12px 30px rgba(0,0,0,0.15)",
      },
    },
  },
};
