import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        apex: {
          dark: '#0A0A0B',
          surface: '#141416',
          green: '#00E676',
          red: '#E53935',
          blue: '#2979FF',
          border: 'rgba(255, 255, 255, 0.05)',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        tight: '0.05em',
      },
    },
  },
  plugins: [],
};

export default config;
