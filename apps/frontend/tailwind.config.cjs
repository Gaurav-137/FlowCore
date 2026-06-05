module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zinc: {
          50: 'rgb(var(--color-zinc-50) / <alpha-value>)',
          100: 'rgb(var(--color-zinc-100) / <alpha-value>)',
          150: 'rgb(var(--color-zinc-150) / <alpha-value>)',
          200: 'rgb(var(--color-zinc-200) / <alpha-value>)',
          250: 'rgb(var(--color-zinc-250) / <alpha-value>)',
          300: 'rgb(var(--color-zinc-300) / <alpha-value>)',
          350: 'rgb(var(--color-zinc-350) / <alpha-value>)',
          400: 'rgb(var(--color-zinc-400) / <alpha-value>)',
          450: 'rgb(var(--color-zinc-450) / <alpha-value>)',
          500: 'rgb(var(--color-zinc-500) / <alpha-value>)',
          550: 'rgb(var(--color-zinc-550) / <alpha-value>)',
          600: 'rgb(var(--color-zinc-600) / <alpha-value>)',
          650: 'rgb(var(--color-zinc-650) / <alpha-value>)',
          700: 'rgb(var(--color-zinc-700) / <alpha-value>)',
          750: 'rgb(var(--color-zinc-750) / <alpha-value>)',
          800: 'rgb(var(--color-zinc-800) / <alpha-value>)',
          850: 'rgb(var(--color-zinc-850) / <alpha-value>)',
          900: 'rgb(var(--color-zinc-900) / <alpha-value>)',
          905: 'rgb(var(--color-zinc-905) / <alpha-value>)',
          950: 'rgb(var(--color-zinc-950) / <alpha-value>)',
        },
        'figma-primary': '#000000',
        'figma-canvas': '#ffffff',
        'figma-ink': '#000000',
        'figma-hairline': '#e6e6e6',
        'figma-hairline-soft': '#f1f1f1',
        'figma-surface-soft': '#f7f7f5',
        'block-lime': '#dceeb1',
        'block-lilac': '#c5b0f4',
        'block-cream': '#f4ecd6',
        'block-pink': '#efd4d4',
        'block-mint': '#c8e6cd',
        'block-coral': '#f3c9b6',
        'block-navy': '#161324',
        'accent-magenta': '#ff3d8b',
        'semantic-success': '#1ea64a',
        indigo: {
          50: '#f6f3fe',
          100: '#eae1fc',
          200: '#d7c7fa',
          300: '#bfa3f6',
          400: '#c5b0f4',
          500: '#9771e4',
          600: '#7f4cdc',
          700: '#6932c5',
          800: '#5829a6',
          900: '#2d2649',
          950: '#161324'
        }
      }
    }
  },
  plugins: []
}

