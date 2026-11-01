/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        risk: {
          low: {
            DEFAULT: '#10b981',
            bg: '#ecfdf5',
            text: '#065f46',
            border: '#a7f3d0',
          },
          medium: {
            DEFAULT: '#f59e0b',
            bg: '#fffbeb',
            text: '#92400e',
            border: '#fde68a',
          },
          high: {
            DEFAULT: '#f97316',
            bg: '#fff7ed',
            text: '#9a3412',
            border: '#fed7aa',
          },
          critical: {
            DEFAULT: '#ef4444',
            bg: '#fef2f2',
            text: '#991b1b',
            border: '#fecaca',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
