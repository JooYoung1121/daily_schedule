/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        warm: {
          50:  'rgb(var(--color-warm-50)  / <alpha-value>)',
          100: 'rgb(var(--color-warm-100) / <alpha-value>)',
          200: 'rgb(var(--color-warm-200) / <alpha-value>)',
          300: 'rgb(var(--color-warm-300) / <alpha-value>)',
          400: 'rgb(var(--color-warm-400) / <alpha-value>)',
          500: 'rgb(var(--color-warm-500) / <alpha-value>)',
          600: 'rgb(var(--color-warm-600) / <alpha-value>)',
          700: 'rgb(var(--color-warm-700) / <alpha-value>)',
          800: 'rgb(var(--color-warm-800) / <alpha-value>)',
          900: 'rgb(var(--color-warm-900) / <alpha-value>)',
        },
        terra: {
          light:   'rgb(var(--color-terra-light) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-terra)       / <alpha-value>)',
          dark:    'rgb(var(--color-terra-dark)  / <alpha-value>)',
        },
        sage: {
          light:   'rgb(var(--color-sage-light) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-sage)       / <alpha-value>)',
          dark:    'rgb(var(--color-sage-dark)  / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'warm':    '0 4px 12px rgba(0, 0, 0, 0.10)',
        'warm-lg': '0 8px 28px rgba(0, 0, 0, 0.14)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in':  'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
