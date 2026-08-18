import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
    './ai/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        petrol: {
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          900: 'var(--accent-900)',
        },
        paper: {
          50: 'var(--app-bg-light)',
          100: '#F5F2EA',
          200: '#EBE5D5',
        },
        gold: {
          500: '#C5A059',
          600: '#B08D46',
        },
        crimson: {
          600: '#A51C30',
          700: '#821426',
        },
        navy: {
          800: '#1A202C',
          900: 'var(--app-bg-dark)',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        reading: 'var(--reading-font-size)',
      },
      lineHeight: {
        reading: '1.85',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [typography],
};
