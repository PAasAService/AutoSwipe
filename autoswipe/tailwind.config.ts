import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy tokens
        background: {
          DEFAULT: '#131318',
          secondary: '#1b1b20',
          card: '#1f1f25',
          elevated: '#2a292f',
        },
        accent: {
          DEFAULT: '#f2c35b',
          light: '#eec058',
          dark: '#d4a843',
          muted: 'rgba(242,195,91,0.15)',
        },
        surface: {
          DEFAULT: '#131318',
          hover: '#1f1f25',
          border: '#4e4636',
        },
        text: {
          primary: '#e4e1e9',
          secondary: '#d2c5b1',
          muted: '#9a8f7d',
          accent: '#f2c35b',
        },
        status: {
          success: '#22C55E',
          error: '#ffb4ab',
          warning: '#F59E0B',
          info: '#3B82F6',
        },
        deal: {
          below: '#22C55E',
          great: '#f2c35b',
          overpriced: '#ffb4ab',
        },
        // Stitch design system tokens
        "on-background": "#e4e1e9",
        "secondary-container": "#3a4859",
        "outline-variant": "#4e4636",
        "outline": "#9a8f7d",
        "on-tertiary-fixed": "#251a00",
        "surface-container-lowest": "#0e0e13",
        "secondary": "#bac8dc",
        "primary": "#f2c35b",
        "surface-dim": "#131318",
        "on-secondary-fixed": "#0f1c2c",
        "on-tertiary": "#3f2e00",
        "on-secondary-fixed-variant": "#3a4859",
        "on-primary-fixed-variant": "#5b4300",
        "on-primary-fixed": "#261a00",
        "inverse-surface": "#e4e1e9",
        "inverse-primary": "#795900",
        "tertiary-container": "#ccaa59",
        "primary-fixed": "#ffdf9f",
        "surface-container-highest": "#35343a",
        "on-tertiary-fixed-variant": "#5a4300",
        "error-container": "#93000a",
        "surface-variant": "#35343a",
        "secondary-fixed": "#d6e4f9",
        "tertiary-fixed-dim": "#e6c26e",
        "on-surface": "#e4e1e9",
        "surface-container-low": "#1b1b20",
        "surface-container": "#1f1f25",
        "on-secondary": "#243141",
        "tertiary": "#eac571",
        "inverse-on-surface": "#303036",
        "tertiary-fixed": "#ffdf98",
        "primary-container": "#d4a843",
        "on-surface-variant": "#d2c5b1",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "surface-container-high": "#2a292f",
        "on-secondary-container": "#a8b6ca",
        "on-primary-container": "#553e00",
        "surface-tint": "#eec058",
        "primary-fixed-dim": "#eec058",
        "on-error-container": "#ffdad6",
        "surface-bright": "#39383e",
        "on-tertiary-container": "#543e00",
        "on-primary": "#402d00",
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        hebrew: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        headline: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        label: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(242,195,91,0.3)',
        'glow-sm': '0 0 10px rgba(242,195,91,0.2)',
        overlay: '0 -20px 60px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #131318 0%, #1b1b20 100%)',
        'card-overlay': 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        'accent-gradient': 'linear-gradient(135deg, #f2c35b 0%, #d4a843 100%)',
      },
      animation: {
        'swipe-left': 'swipeLeft 0.3s ease-out forwards',
        'swipe-right': 'swipeRight 0.3s ease-out forwards',
        'card-enter': 'cardEnter 0.3s ease-out',
        'pulse-accent': 'pulseAccent 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        swipeLeft: {
          to: { transform: 'translateX(-150%) rotate(-30deg)', opacity: '0' },
        },
        swipeRight: {
          to: { transform: 'translateX(150%) rotate(30deg)', opacity: '0' },
        },
        cardEnter: {
          from: { transform: 'scale(0.95) translateY(20px)', opacity: '0' },
          to: { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        pulseAccent: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(242,195,91,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(242,195,91,0.5)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
