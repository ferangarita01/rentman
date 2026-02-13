import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "var(--primary)",
                secondary: "var(--secondary)",
                accent: "var(--accent)",
                "card-bg": "var(--card-bg)",
                "card-border": "var(--card-border)",

                // Rentman OS Theme
                rentman: {
                    neon: "#00ff55",
                    dark: "#050505",
                    slate: "#94a3b8",
                    border: "#1a2e21"
                },

                // Legacy Sarah Token Compat
                sarah: {
                    bg: "var(--sarah-bg)",
                    "text-primary": "var(--sarah-text-primary)",
                    primary: "var(--sarah-primary)",
                    secondary: "var(--sarah-secondary)",
                    surface: "var(--sarah-surface)",
                    muted: "var(--sarah-text-muted)",
                }
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
                grotesk: ["var(--font-space-grotesk)", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
