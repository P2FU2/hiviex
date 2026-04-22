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
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          muted: 'var(--accent-muted)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px var(--border-subtle)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--border-subtle)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255,255,255,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.3)' },
        },
      },
    },
  },
  plugins: [],
}

