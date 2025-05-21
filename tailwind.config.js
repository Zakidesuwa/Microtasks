module.exports = {
  darkMode: 'class', // Absolutely ensure this is 'class'
  content: [
    './src/**/*.{html,js,svelte,ts}', // Ensure this covers ALL .svelte files
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};