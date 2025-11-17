import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  safelist: [
    'bg-green-100', 'text-green-800',
    'bg-red-100', 'text-red-800',
    'bg-blue-100', 'text-blue-800',
    'bg-yellow-100', 'text-yellow-800',
    'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4',
    'w-4', 'h-4', 'w-6', 'h-6', 'w-8', 'h-8',
    'animate-spin', 'animate-pulse', 'animate-bounce',
    { pattern: /^bg-(red|green|blue|gray|yellow)-(100|200|300|400|500)$/ },
    { pattern: /^text-(red|green|blue|gray|yellow)-(700|800|900)$/ },
    { pattern: /^text-(xs|sm|base|lg|xl)$/ },
    { pattern: /^p-(1|2|3|4|5|6)$/ },
    { pattern: /^m-(1|2|3|4|5|6)$/ },
    { pattern: /^gap-(1|2|3|4|5|6)$/ },
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        creative: {
          DEFAULT: "hsl(var(--creative))",
          foreground: "hsl(var(--creative-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'tremor-small': '0.375rem',
        'tremor-full': '9999px',
      },
      fontSize: {
        'tremor-label': '0.75rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0)",
          },
          "50%": { 
            boxShadow: "0 0 8px 4px hsl(var(--primary) / 0.4)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s infinite ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

