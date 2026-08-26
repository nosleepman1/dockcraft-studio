export type ThemeMode = 'oled' | 'light' | 'midnight' | 'cyberpunk' | 'nord' | 'emerald';

export interface ThemeDefinition {
  id: ThemeMode;
  name: string;
  category: 'dark' | 'light';
  previewColor: string;
  accentColor: string;
  description: string;
  cssVariables: Record<string, string>;
}

export const THEMES: Record<ThemeMode, ThemeDefinition> = {
  oled: {
    id: 'oled',
    name: 'Pure OLED Black',
    category: 'dark',
    previewColor: '#000000',
    accentColor: '#3B82F6',
    description: '100% pure #000000 pitch black for maximum OLED contrast and battery efficiency',
    cssVariables: {
      '--bg-main': '#000000',
      '--bg-card': '#0a0a0a',
      '--bg-sidebar': '#050505',
      '--bg-header': '#000000',
      '--border-color': '#1f1f1f',
      '--text-main': '#ffffff',
      '--text-muted': '#888888',
      '--accent-color': '#3B82F6',
      '--hover-bg': '#141414',
    }
  },
  light: {
    id: 'light',
    name: 'Clean Light (Blanc Épuré)',
    category: 'light',
    previewColor: '#ffffff',
    accentColor: '#2563EB',
    description: 'Crisp, minimalist white design with soft borders and high daylight readability',
    cssVariables: {
      '--bg-main': '#f8fafc',
      '--bg-card': '#ffffff',
      '--bg-sidebar': '#ffffff',
      '--bg-header': '#ffffff',
      '--border-color': '#e2e8f0',
      '--text-main': '#0f172a',
      '--text-muted': '#64748b',
      '--accent-color': '#2563EB',
      '--hover-bg': '#f1f5f9',
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Slate (Default)',
    category: 'dark',
    previewColor: '#070c14',
    accentColor: '#1D63ED',
    description: 'Classic deep navy Docker dark mode optimized for long coding sessions',
    cssVariables: {
      '--bg-main': '#070c14',
      '--bg-card': '#0e1726',
      '--bg-sidebar': '#0c1322',
      '--bg-header': '#080d17',
      '--border-color': '#1e293b',
      '--text-main': '#f1f5f9',
      '--text-muted': '#94a3b8',
      '--accent-color': '#1D63ED',
      '--hover-bg': '#152238',
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'dark',
    previewColor: '#080812',
    accentColor: '#00f0ff',
    description: 'Futuristic high-tech vibe with electric neon cyan and purple accents',
    cssVariables: {
      '--bg-main': '#080812',
      '--bg-card': '#101026',
      '--bg-sidebar': '#0c0c1c',
      '--bg-header': '#0a0a18',
      '--border-color': '#2c1e54',
      '--text-main': '#fdfdfd',
      '--text-muted': '#9d8ec7',
      '--accent-color': '#00f0ff',
      '--hover-bg': '#1c1538',
    }
  },
  nord: {
    id: 'nord',
    name: 'Nordic Frost',
    category: 'dark',
    previewColor: '#242933',
    accentColor: '#88C0D0',
    description: 'Arctic cold blue palette inspired by the beloved Nord theme',
    cssVariables: {
      '--bg-main': '#242933',
      '--bg-card': '#2e3440',
      '--bg-sidebar': '#2b303c',
      '--bg-header': '#20242d',
      '--border-color': '#3b4252',
      '--text-main': '#eceff4',
      '--text-muted': '#d8dee9',
      '--accent-color': '#88C0D0',
      '--hover-bg': '#3b4252',
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    category: 'dark',
    previewColor: '#051310',
    accentColor: '#10B981',
    description: 'Deep forest green-slate aesthetic with luminous emerald highlights',
    cssVariables: {
      '--bg-main': '#051310',
      '--bg-card': '#0b201b',
      '--bg-sidebar': '#081a16',
      '--bg-header': '#061613',
      '--border-color': '#133930',
      '--text-main': '#ecfdf5',
      '--text-muted': '#6ee7b7',
      '--accent-color': '#10B981',
      '--hover-bg': '#123b32',
    }
  }
};

export function applyTheme(themeId: ThemeMode) {
  const theme = THEMES[themeId] || THEMES.midnight;
  const root = document.documentElement;

  // Apply dark/light class
  if (theme.category === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // Set CSS variables
  Object.entries(theme.cssVariables).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  try {
    localStorage.setItem('dockcraft_theme', themeId);
  } catch (_) {}
}

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('dockcraft_theme') as ThemeMode;
    if (saved && THEMES[saved]) return saved;
  } catch (_) {}
  return 'midnight';
}
