/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        'display': ['clamp(2.25rem,5vw,3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'title': ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.55' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          fg: 'var(--accent-foreground)',
        },
        ui: {
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'premium-sm': 'var(--shadow-sm)',
        'premium-md': 'var(--shadow-md)',
        glass: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px var(--border-subtle)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--border-subtle)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '280ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn var(--transition-slow) ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(129,140,248,0.15)' },
          '100%': { boxShadow: '0 0 24px rgba(129,140,248,0.25)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
