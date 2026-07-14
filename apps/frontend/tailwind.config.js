/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        // ── Tokens de l'interface Caissier (RestauManager POS) ──
        bg: '#f0f4fb',
        surface: '#ffffff',
        surface2: '#f4f7fc',
        surface3: '#eaf0fb',
        border: '#dde5f4',
        border2: '#c5d2ea',
        blue: { DEFAULT: '#417fed', 2: '#3168e3', 3: '#3b82f6' },
        green: '#22c55e',
        red: '#ef4444',
        orange: '#f97316',
      },
      borderRadius: {
        r: '8px',
        r2: '12px',
        r3: '18px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,.07)',
        modal: '0 8px 30px rgba(0,0,0,.14)',
        glow: '0 3px 10px rgba(37,99,235,0.22)',
      },
    },
  },
  plugins: [],
};