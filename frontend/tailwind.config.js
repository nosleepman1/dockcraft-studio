/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg-main)',
          card: 'var(--bg-card)',
          sidebar: 'var(--bg-sidebar)',
          header: 'var(--bg-header)',
          border: 'var(--border-color)',
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
          accent: 'var(--accent-color)',
          hover: 'var(--hover-bg)',
        },
        docker: {
          blue: '#1D63ED',
          dark: '#0e1726',
          darker: '#070c14',
          card: '#131e32',
          border: '#1f2e4d',
          accent: '#00D1B2',
          warning: '#F59E0B',
          danger: '#EF4444',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px -5px rgba(29, 99, 237, 0.5)',
        'glow-accent': '0 0 20px -5px rgba(0, 209, 178, 0.5)',
        'glow-purple': '0 0 20px -5px rgba(139, 92, 246, 0.5)',
        'node-selected': '0 0 0 2px var(--accent-color, #1D63ED), 0 10px 25px -5px rgba(29, 99, 237, 0.3)',
      }
    },
  },
  plugins: [],
}
