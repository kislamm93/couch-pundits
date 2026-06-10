/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        fg: 'rgb(var(--c-fg) / <alpha-value>)',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
