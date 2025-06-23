/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },      fontFamily: {
        sans: [
          'Prompt',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif'
        ],
      },
      screens: {
        'xs': '475px',
        'safe': '380px',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#2196f3",
          "secondary": "#03dac6",
          "accent": "#ff4081",
          "neutral": "#2a2e37",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#e0e0e0",
          "info": "#2196f3",
          "success": "#4caf50",
          "warning": "#ff9800",
          "error": "#f44336",
        },
        dark: {
          "primary": "#2196f3",
          "secondary": "#03dac6",
          "accent": "#ff4081",
          "neutral": "#191d24",
          "base-100": "#2a2e37",
          "base-200": "#16181d",
          "base-300": "#0f1114",
          "info": "#2196f3",
          "success": "#4caf50",
          "warning": "#ff9800",
          "error": "#f44336",
        }
      }
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}
