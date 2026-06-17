import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          gold: '#C9A962',
          'gold-light': '#DFC98A',
          champagne: '#E8DCC0',
          pink: '#FF4DA6',
          orange: '#FF9B54',
          purple: '#8B7CFF',
          cyan: '#54D2FF',
          green: '#39D98A',
          yellow: '#FFD166',
          /* legacy aliases */
          magenta: '#FF4DA6',
          'magenta-dark': '#E03D8F',
          blue: '#54D2FF',
          coral: '#FF9B54',
        },
        space: {
          DEFAULT: '#10131A',
          surface: '#171B24',
          elevated: '#1D2330',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': '1.5rem',
      },
      transitionDuration: {
        motion: '220ms',
      },
      transitionTimingFunction: {
        motion: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(8px, -12px) scale(1.03)' },
          '66%': { transform: 'translate(-6px, 8px) scale(0.98)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'aurora-drift-a': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          '33%': { transform: 'translate(-2%, 3%) rotate(6deg) scale(1.04)' },
          '66%': { transform: 'translate(3%, -2%) rotate(-4deg) scale(0.97)' },
        },
        'aurora-drift-b': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(4%, -3%) rotate(8deg)' },
        },
        'aurora-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.08)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'accordion-up': 'accordion-up 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        blob: 'blob 18s ease-in-out infinite',
        'fade-up': 'fade-up 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 3s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['var(--font-vazirmatn)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        glow: '0 0 48px -12px rgba(255, 77, 166, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #C9A962 0%, #DFC98A 45%, #E8DCC0 100%)',
        'brand-warm': 'linear-gradient(135deg, #FF4DA6 0%, #FF9B54 55%, #FFD166 100%)',
        'brand-rainbow': 'linear-gradient(135deg, #FF4DA6 0%, #8B7CFF 50%, #54D2FF 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
