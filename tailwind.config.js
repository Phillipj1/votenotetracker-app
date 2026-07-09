/** @type {import('tailwindcss').Config} */
export default {
  // These paths are relative to the PROJECT ROOT (where you run `npm run dev`),
  // NOT relative to the Vite "client" root. Your real source files live in
  // client/src, so that's what we need to point at here.
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
 