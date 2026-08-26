import { describe, it, expect, beforeEach } from 'vitest';
import { THEMES, applyTheme, ThemeMode } from '../themes/themeConfig';

describe('Theme System (6 Themes)', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('style');
  });

  it('should support all 6 required themes including OLED and Light', () => {
    const themeKeys = Object.keys(THEMES) as ThemeMode[];
    expect(themeKeys).toContain('oled');
    expect(themeKeys).toContain('light');
    expect(themeKeys).toContain('midnight');
    expect(themeKeys).toContain('cyberpunk');
    expect(themeKeys).toContain('nord');
    expect(themeKeys).toContain('emerald');
  });

  it('should apply Pure OLED Black theme variables correctly', () => {
    applyTheme('oled');
    const root = document.documentElement;
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.getPropertyValue('--bg-main')).toBe('#000000');
  });

  it('should apply Clean Light theme correctly', () => {
    applyTheme('light');
    const root = document.documentElement;
    expect(root.classList.contains('light')).toBe(true);
    expect(root.style.getPropertyValue('--bg-main')).toBe('#f8fafc');
  });
});
