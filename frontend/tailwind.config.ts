import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Morpho Palette
                morpho: {
                    bg: {
                        main: '#15181A', // Darkest
                        surface: '#222529', // Card bg
                        surface2: '#383B3E', // Border/Hover
                    },
                    text: {
                        primary: '#FFFFFF',
                        secondary: '#9C9D9F',
                        tertiary: '#6F7174',
                    },
                    blue: {
                        dark: '#2973FF',
                        DEFAULT: '#5792FF', // Primary Action
                        light: '#C4DAFF',
                    },
                    red: '#FF4D4D',
                    green: '#4DFF4D',
                }
            },
            fontFamily: {
                sans: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'monospace'],
            },
            backgroundImage: {
                'cosmic-gradient': 'linear-gradient(to right bottom, #0f0f1a, #1a1a2e, #16213e)',
                'hero-gradient': 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                'card-gradient': 'linear-gradient(180deg, rgba(30, 30, 45, 0.8) 0%, rgba(24, 24, 37, 0.8) 100%)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
