/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "custom-dark": "#212121",
        "custom-light": "#2f2f2f",
        "custom-gray": "#171717",
      },
    },
  },
  plugins: [],
};
