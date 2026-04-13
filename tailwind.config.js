/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          50:  '#FDFAF6',
          100: '#F5EFE6',
          200: '#EBE0D3',
          300: '#D9CBBA',
          400: '#C4AA91',
          500: '#A88B6E',
          600: '#8B6E52',
          700: '#6E5340',
          800: '#4A3828',
          900: '#2C2118',
        },
        terra: {
          light: '#F5C4AF',
          DEFAULT: '#D4715A',
          dark:  '#B35A42',
        },
        sage: {
          light: '#C2DDD6',
          DEFAULT: '#5E9E8A',
          dark:  '#3D7A68',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(44, 33, 24, 0.08)',
        'warm':    '0 4px 12px rgba(44, 33, 24, 0.10)',
        'warm-lg': '0 8px 28px rgba(44, 33, 24, 0.14)',
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
