/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  daisyui: {
    themes: [
      {
        eduverse: {
          primary: '#0F5132',
          'primary-content': '#F3F8F5',
          secondary: '#E8A33D',
          'secondary-content': '#3A2405',
          accent: '#2C7A54',
          'accent-content': '#F3F8F5',
          neutral: '#1C2530',
          'neutral-content': '#F4F6F8',
          'base-100': '#FFFFFF',
          'base-200': '#F4F6F8',
          'base-300': '#E4E8EC',
          'base-content': '#1C2530',
          info: '#2563EB',
          success: '#16A34A',
          warning: '#E8A33D',
          error: '#DC2626',
        },
      },
    ],
    darkTheme: 'eduverse',
  },
  plugins: [require('daisyui')],
}
