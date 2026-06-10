/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E14',
        card: '#151A23',
        border: '#222936',
        accent: '#00E07A',
        muted: '#8A93A3',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
