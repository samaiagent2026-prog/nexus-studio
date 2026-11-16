const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const channelScale = (name) =>
  Object.fromEntries(STOPS.map((stop) => [stop, `rgb(var(--${name}-${stop}-rgb) / <alpha-value>)`]))

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      colors: {
        // Channel-based tokens so Tailwind opacity modifiers work while the
        // palette stays runtime-themeable (see applyTheme in lib/theme.ts).
        brand: channelScale('brand'),
        ink: channelScale('ink'),
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem' },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,.04), 0 8px 24px -8px rgba(16,24,40,.10)',
        lift: '0 2px 4px rgba(16,24,40,.05), 0 18px 40px -12px rgba(16,24,40,.18)',
        glow: '0 0 0 1px rgba(255,255,255,.08), 0 24px 60px -18px var(--brand-500)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .4s ease both',
        'scale-in': 'scale-in .25s cubic-bezier(.16,1,.3,1) both',
        float: 'float 5s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
