
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
        'brand-blue': '#255FED',
        'brand-blue-dark': '#10276F',
        'brand-blue-mid': '#173DA6',
        'brand-pink': '#E4007C',
        'brand-pink-light': '#FFE8F5',
        'brand-slate': '#1F2937',
        'brand-slate-light': '#F4F6FB',
        'japifon-blue': '#007bff',
        'japifon-dark-blue': '#003366',
        'japifon-green': '#28a745',
        'japifon-light-green': '#e6ffe6',
        'japifon-gray-dark': '#343a40',
        'japifon-gray-mid': '#6c757d',
        'japifon-gray-light': '#f8f9fa',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        brand: '0 10px 35px -12px rgba(37, 95, 237, 0.35)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
