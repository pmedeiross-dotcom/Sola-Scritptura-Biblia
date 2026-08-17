/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
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
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Source Sans 3', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      fontSize: {
        reading: 'var(--reading-font-size)',
      },
      lineHeight: {
        reading: '1.85',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
