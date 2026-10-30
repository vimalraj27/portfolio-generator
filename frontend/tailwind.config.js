/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Outfit", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
}
