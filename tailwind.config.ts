import type { Config } from 'tailwindcss'

/**
 * Fresh Breeze BnB Services — Design System
 *
 * Color extraction from brand logos:
 *  • brand     → Orange  #FF6600  ("Fresh" text gradient)
 *  • secondary → Blue    #0077E6  ("Breeze" text gradient)
 *  • accent    → Crimson #E31837  (swirl base / "sh" tail)
 *
 * All color tokens use CSS variables so dark-mode overrides work seamlessly.
 * Pattern: rgb(var(--color-X) / <alpha-value>)  → enables opacity modifiers (e.g. bg-brand-500/50)
 */
export default {
  darkMode: 'class',

  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './nuxt.config.{js,ts}',
  ],

  theme: {
    extend: {
      // ─── Color palette ──────────────────────────────────────────────────────
      colors: {
        // Global defaults for development: primary (blue) + primary-warm (orange)
        primary: {
          50:  'rgb(var(--color-primary-50)  / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
        },
        'primary-warm': {
          50:  'rgb(var(--color-primary-warm-50)  / <alpha-value>)',
          100: 'rgb(var(--color-primary-warm-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-warm-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-warm-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-warm-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-warm-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-warm-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-warm-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-warm-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-warm-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-warm-500) / <alpha-value>)',
        },

        brand: {
          50:  'rgb(var(--color-brand-50)  / <alpha-value>)',
          100: 'rgb(var(--color-brand-100) / <alpha-value>)',
          200: 'rgb(var(--color-brand-200) / <alpha-value>)',
          300: 'rgb(var(--color-brand-300) / <alpha-value>)',
          400: 'rgb(var(--color-brand-400) / <alpha-value>)',
          500: 'rgb(var(--color-brand-500) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700) / <alpha-value>)',
          800: 'rgb(var(--color-brand-800) / <alpha-value>)',
          900: 'rgb(var(--color-brand-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-brand-500) / <alpha-value>)',
        },
        secondary: {
          50:  'rgb(var(--color-secondary-50)  / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-secondary-500) / <alpha-value>)',
        },
        accent: {
          50:  'rgb(var(--color-accent-50)  / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-accent-500) / <alpha-value>)',
        },

        // ── Semantic surface / text tokens ─────────────────────────────────
        surface:       'rgb(var(--color-surface)      / <alpha-value>)',
        'surface-soft':'rgb(var(--color-surface-soft) / <alpha-value>)',
        border:        'rgb(var(--color-border)       / <alpha-value>)',
        foreground:    'rgb(var(--color-foreground)   / <alpha-value>)',
        muted:         'rgb(var(--color-muted)        / <alpha-value>)',

        // ── Status tokens ───────────────────────────────────────────────────
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger:  'rgb(var(--color-danger)  / <alpha-value>)',
      },

      // ─── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ─── Border radius ───────────────────────────────────────────────────
      borderRadius: {
        xs:   '0.125rem',   //  2px
        sm:   '0.25rem',    //  4px
        md:   '0.375rem',   //  6px
        lg:   '0.5rem',     //  8px
        xl:   '0.75rem',    // 12px
        '2xl':'1rem',       // 16px
        '3xl':'1.5rem',     // 24px
      },

      // ─── Box shadows ─────────────────────────────────────────────────────
      boxShadow: {
        soft:     '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        card:     '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        elevated: '0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.07)',
      },

      // ─── Spacing extras ──────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',   // 18px — gap between icon and label
        '13':  '3.25rem',    // 52px
        '15':  '3.75rem',    // 60px
        '18':  '4.5rem',     // 72px
        '22':  '5.5rem',     // 88px
      },
    },
  },

  plugins: [],
} satisfies Config
