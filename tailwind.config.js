/** @type {import('tailwindcss').Config} */
const neutralScale = {
  50: "rgb(var(--app-text-rgb) / <alpha-value>)",
  100: "rgb(var(--app-text-rgb) / <alpha-value>)",
  200: "rgb(var(--app-text-soft-rgb) / <alpha-value>)",
  300: "rgb(var(--app-text-soft-rgb) / <alpha-value>)",
  400: "rgb(var(--app-text-muted-rgb) / <alpha-value>)",
  500: "rgb(var(--app-text-subtle-rgb) / <alpha-value>)",
  600: "rgb(var(--app-text-muted-rgb) / <alpha-value>)",
  700: "rgb(var(--app-border-rgb) / <alpha-value>)",
  800: "rgb(var(--app-surface-soft-rgb) / <alpha-value>)",
  900: "rgb(var(--app-surface-rgb) / <alpha-value>)",
  950: "rgb(var(--app-bg-rgb) / <alpha-value>)",
}

const infoScale = {
  50: "rgb(var(--app-info-surface-rgb) / <alpha-value>)",
  100: "rgb(var(--app-info-surface-rgb) / <alpha-value>)",
  200: "rgb(var(--app-info-rgb) / <alpha-value>)",
  300: "rgb(var(--app-info-rgb) / <alpha-value>)",
  400: "rgb(var(--app-info-rgb) / <alpha-value>)",
  500: "rgb(var(--app-info-strong-rgb) / <alpha-value>)",
  600: "rgb(var(--app-info-strong-rgb) / <alpha-value>)",
  700: "rgb(var(--app-info-strong-rgb) / <alpha-value>)",
  800: "rgb(var(--app-info-surface-rgb) / <alpha-value>)",
  900: "rgb(var(--app-info-surface-rgb) / <alpha-value>)",
  950: "rgb(var(--app-info-surface-rgb) / <alpha-value>)",
}

const successScale = {
  50: "rgb(var(--app-success-surface-rgb) / <alpha-value>)",
  100: "rgb(var(--app-success-surface-rgb) / <alpha-value>)",
  200: "rgb(var(--app-success-rgb) / <alpha-value>)",
  300: "rgb(var(--app-success-rgb) / <alpha-value>)",
  400: "rgb(var(--app-success-rgb) / <alpha-value>)",
  500: "rgb(var(--app-success-strong-rgb) / <alpha-value>)",
  600: "rgb(var(--app-success-strong-rgb) / <alpha-value>)",
  700: "rgb(var(--app-success-strong-rgb) / <alpha-value>)",
  800: "rgb(var(--app-success-surface-rgb) / <alpha-value>)",
  900: "rgb(var(--app-success-surface-rgb) / <alpha-value>)",
  950: "rgb(var(--app-success-surface-rgb) / <alpha-value>)",
}

const warningScale = {
  50: "rgb(var(--app-warning-surface-rgb) / <alpha-value>)",
  100: "rgb(var(--app-warning-surface-rgb) / <alpha-value>)",
  200: "rgb(var(--app-warning-rgb) / <alpha-value>)",
  300: "rgb(var(--app-warning-rgb) / <alpha-value>)",
  400: "rgb(var(--app-warning-rgb) / <alpha-value>)",
  500: "rgb(var(--app-warning-strong-rgb) / <alpha-value>)",
  600: "rgb(var(--app-warning-strong-rgb) / <alpha-value>)",
  700: "rgb(var(--app-warning-strong-rgb) / <alpha-value>)",
  800: "rgb(var(--app-warning-surface-rgb) / <alpha-value>)",
  900: "rgb(var(--app-warning-surface-rgb) / <alpha-value>)",
  950: "rgb(var(--app-warning-surface-rgb) / <alpha-value>)",
}

const dangerScale = {
  50: "rgb(var(--app-danger-surface-rgb) / <alpha-value>)",
  100: "rgb(var(--app-danger-surface-rgb) / <alpha-value>)",
  200: "rgb(var(--app-danger-rgb) / <alpha-value>)",
  300: "rgb(var(--app-danger-rgb) / <alpha-value>)",
  400: "rgb(var(--app-danger-rgb) / <alpha-value>)",
  500: "rgb(var(--app-danger-strong-rgb) / <alpha-value>)",
  600: "rgb(var(--app-danger-strong-rgb) / <alpha-value>)",
  700: "rgb(var(--app-danger-strong-rgb) / <alpha-value>)",
  800: "rgb(var(--app-danger-surface-rgb) / <alpha-value>)",
  900: "rgb(var(--app-danger-surface-rgb) / <alpha-value>)",
  950: "rgb(var(--app-danger-surface-rgb) / <alpha-value>)",
}

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "rgb(var(--app-bg-rgb) / <alpha-value>)",
        white: "rgb(var(--app-text-rgb) / <alpha-value>)",
        gray: neutralScale,
        zinc: neutralScale,
        blue: infoScale,
        indigo: infoScale,
        purple: {
          ...infoScale,
          300: "rgb(var(--app-purple-rgb) / <alpha-value>)",
          400: "rgb(var(--app-purple-rgb) / <alpha-value>)",
          500: "rgb(var(--app-purple-strong-rgb) / <alpha-value>)",
          600: "rgb(var(--app-purple-strong-rgb) / <alpha-value>)",
        },
        cyan: infoScale,
        emerald: successScale,
        green: successScale,
        teal: successScale,
        amber: warningScale,
        yellow: warningScale,
        orange: warningScale,
        red: dangerScale,
        rose: dangerScale,
      },
    },
  },
  plugins: [],
}
