/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8fb6ff',
          400: '#5b8dff',
          500: '#3563e9',
          600: '#2447c9',
          700: '#1d38a1',
          800: '#1d3182',
          900: '#1e2e6b',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c9',
          400: '#8592aa',
          500: '#64728e',
          600: '#4f5a74',
          700: '#414a5f',
          800: '#394050',
          900: '#0f1522',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,21,34,0.04), 0 8px 24px rgba(15,21,34,0.06)',
        'card-hover': '0 2px 4px rgba(15,21,34,0.06), 0 12px 32px rgba(15,21,34,0.10)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
