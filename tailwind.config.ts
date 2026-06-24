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
        /* Chromatic Spectrum — arc colors from logo */
        arc: {
          blue:   '#3B82F6',
          green:  '#10B981',
          amber:  '#F59E0B',
          pink:   '#EC4899',
          red:    '#EF4444',
          teal:   '#14B8A6',
        },
        cs: {
          canvas:    '#07080E',
          'surface-1': '#0C0D15',
          'surface-2': '#121420',
          'surface-3': '#1A1C2A',
        },
        brand: {
          gold: '#D4AF37',
          'gold-light': '#E4C76B',
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
        midnight: '#0B1020',
        canvas: '#020617',
        space: {
          DEFAULT: '#0B1020',
          surface: '#101828',
          elevated: '#1a2236',
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
        'spectrum-orbit': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'arc-glow-pulse': {
          '0%, 100%': { opacity: '0.6', filter: 'blur(32px)' },
          '50%':      { opacity: '1',   filter: 'blur(22px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'accordion-up': 'accordion-up 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        blob: 'blob 18s ease-in-out infinite',
        'fade-up': 'fade-up 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 3s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'spectrum-orbit': 'spectrum-orbit 18s linear infinite',
        'arc-glow-pulse': 'arc-glow-pulse 4s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['var(--font-vazirmatn)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        glow: '0 0 48px -12px rgba(255, 77, 166, 0.4)',
        'arc-blue':  '0 0 32px -8px rgba(59,130,246,0.5)',
        'arc-green': '0 0 32px -8px rgba(16,185,129,0.5)',
        'arc-amber': '0 0 32px -8px rgba(245,158,11,0.5)',
        'arc-pink':  '0 0 32px -8px rgba(236,72,153,0.5)',
        'arc-red':   '0 0 32px -8px rgba(239,68,68,0.5)',
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
