/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0F0F0F',
        card: '#1A1A1A',
        primary: '#D4A843',
        'text-primary': '#F5F5F5',
        'text-muted': '#888888',
        success: '#4CAF50',
        error: '#F44336',
      },
    },
  },
  plugins: [],
};
