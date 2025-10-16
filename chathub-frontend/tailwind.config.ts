
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
        'japifon-blue': '#007bff',
        'japifon-dark-blue': '#003366',
        'japifon-green': '#28a745',
        'japifon-light-green': '#e6ffe6',
        'japifon-gray-dark': '#343a40',
        'japifon-gray-mid': '#6c757d',
        'japifon-gray-light': '#f8f9fa',
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
