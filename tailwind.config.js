/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#4f46e5',
                    dark: '#4338ca',
                },
                secondary: '#10b981',
            },
            padding: {
                'safe': 'env(safe-area-inset-bottom)',
            }
        },
    },
    plugins: [],
}
