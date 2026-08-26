import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon } from 'lucide-react';
import { THEMES, ThemeMode } from '../../themes/themeConfig';
import { useDockerStore } from '../../store/useDockerStore';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme } = useDockerStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTheme = THEMES[currentTheme] || THEMES.midnight;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-theme-hover hover:opacity-90 text-theme-text border border-theme-border transition-colors shadow-sm"
        title="Choose Interface Theme"
      >
        <Palette className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
        <span className="hidden sm:inline">{activeTheme.name}</span>
        <div
          className="w-2.5 h-2.5 rounded-full border border-theme-border"
          style={{ backgroundColor: activeTheme.previewColor }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-theme-card border border-theme-border rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
          <div className="px-2 py-1.5 border-b border-theme-border mb-1 flex items-center justify-between text-[11px] font-bold text-theme-muted uppercase tracking-wider">
            <span>Interface Themes (6)</span>
            {activeTheme.category === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </div>

          {Object.values(THEMES).map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id);
                  setIsOpen(false);
                }}
                className={`w-full p-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-theme-hover font-semibold border border-theme-accent/40 shadow-sm'
                    : 'hover:bg-theme-hover/60 text-theme-text'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full border border-theme-border shrink-0 shadow-inner"
                    style={{ backgroundColor: theme.previewColor, borderColor: theme.accentColor }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs text-theme-text flex items-center gap-1.5">
                      <span>{theme.name}</span>
                      {theme.id === 'oled' && (
                        <span className="text-[9px] px-1 py-0.2 bg-white text-black font-extrabold rounded">000</span>
                      )}
                    </div>
                    <span className="text-[10px] text-theme-muted line-clamp-1 block">
                      {theme.description}
                    </span>
                  </div>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
