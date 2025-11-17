/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          500: '#f59e0b',
          700: '#b45309',
        },
        danger: {
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
}
