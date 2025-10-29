import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import themeService, { Theme } from '../services/themeService';

interface ThemeContextType {
  currentTheme: string;
  availableThemes: Theme[];
  setTheme: (themeKey: string) => Promise<void>;
  updateCurrentTheme: (themeKey: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<string>(themeService.getCurrentTheme());
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeThemes = async () => {
      console.log('ThemeProvider: Initializing themes...');
      try {
        // Load available themes
        const themes = await themeService.getAvailableThemes();
        console.log('ThemeProvider: Available themes:', themes);
        setAvailableThemes(themes);

        // Preload all themes for faster switching
        const themeKeys = themes.map(t => t.key);
        await themeService.preloadThemes(themeKeys);

        // Apply current theme
        console.log('ThemeProvider: Applying current theme:', currentTheme);
        await themeService.applyTheme(currentTheme);
      } catch (error) {
        console.error('Failed to initialize themes:', error);
      } finally {
        setIsLoading(false);
        console.log('ThemeProvider: Initialization complete');
      }
    };

    initializeThemes();
  }, []); // Remove currentTheme dependency to avoid re-initialization

  // Separate effect to handle theme changes
  useEffect(() => {
    if (!isLoading && currentTheme) {
      console.log('ThemeProvider: Current theme changed to:', currentTheme);
      themeService.applyTheme(currentTheme);
    }
  }, [currentTheme, isLoading]);

  const setTheme = async (themeKey: string): Promise<void> => {
    console.log('ThemeProvider: setTheme called with:', themeKey);
    try {
      await themeService.applyTheme(themeKey);
      setCurrentTheme(themeKey);
      console.log('ThemeProvider: Theme set successfully');
    } catch (error) {
      console.error('Failed to set theme:', error);
      throw error;
    }
  };

  const updateCurrentTheme = (themeKey: string): void => {
    console.log('ThemeProvider: updateCurrentTheme called with:', themeKey);
    setCurrentTheme(themeKey);
  };

  const value: ThemeContextType = {
    currentTheme,
    availableThemes,
    setTheme,
    updateCurrentTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};