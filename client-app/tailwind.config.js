/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#e879f9', 400: '#d946ef', 500: '#c026d3',
          600: '#a21caf', 700: '#86198f', 800: '#701a75',
          900: '#4a044e',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
