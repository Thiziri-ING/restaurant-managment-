/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Vos couleurs primaires d'origine
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#1638f9ff',
          600: '#0c2deaff',
          700: '#2773c5ff',
        },
        // Couleurs de structure (fonds et bordures) extraites du caissier
        bg: 'var(--bg, #f1f5f9)',
        surface: 'var(--surface, #ffffff)',
        surface2: 'var(--surface2, #f8fafc)',
        surface3: 'var(--surface3, #e2e8f0)',
        border: 'var(--border, #cbd5e1)',
        border2: 'var(--border2, #94a3b8)',
        
        // Couleurs sémantiques et leurs déclinaisons "soft"
        blue: {
          DEFAULT: 'var(--blue, #3b82f6)',
          soft: 'var(--blue-soft, #eff6ff)',
          2: 'var(--blue2, #2563eb)',
        },
        green: {
          DEFAULT: 'var(--green, #22c55e)',
          soft: 'var(--green-soft, #dcfce7)',
        },
        red: {
          DEFAULT: 'var(--red, #ef4444)',
          soft: 'var(--red-soft, #fee2e2)',
        },
        orange: {
          DEFAULT: 'var(--orange, #f97316)',
          soft: 'var(--orange-soft, #ffedd5)',
        }
      },
      boxShadow: {
        // Ombres spécifiques utilisées pour les cartes, modales et boutons
        card: '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.01)',
        modal: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        glow: '0 0 10px rgba(59, 130, 246, 0.5)',
      },
      borderRadius: {
        // Arrondis personnalisés utilisés sur vos boutons et cartes (rounded-r, rounded-r2)
        'r': '0.5rem',
        'r2': '0.75rem',
        'r3': '1rem',
      },
      animation: {
        // Animations d'apparition pour une interface fluide
        'modal-in': 'modalIn 0.3s ease-out forwards',
        'toast-in': 'toastIn 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};