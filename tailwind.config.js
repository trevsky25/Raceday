/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        asphalt: {
          950: '#0b0c0e',
          900: '#111317',
          800: '#191c21',
          700: '#23272e',
          600: '#2f343d',
          400: '#6b7280',
        },
        caution: {
          DEFAULT: '#ffd400',
          dim: '#c7a600',
        },
        leader: '#2ee06f',
        penalty: '#ff4d4d',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 212, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
