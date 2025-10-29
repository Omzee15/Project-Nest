export interface Theme {
  name: string;
  key: string;
  type: 'light' | 'dark';
}

export interface ThemeConfig {
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://localhost:${import.meta.env.VITE_BACKEND_PORT || '8080'}/api`;

class ThemeService {
  private static instance: ThemeService;
  private currentTheme: string = 'projectnest-default';
  private loadedThemes: Map<string, ThemeConfig> = new Map();

  // Available themes - only these 3
  private availableThemes: Theme[] = [
    {
      name: 'ProjectNest Default',
      key: 'projectnest-default',
      type: 'light',
    },
    {
      name: 'ProjectNest Dark',
      key: 'projectnest-dark',
      type: 'dark',
    },
    {
      name: 'Solarized Light',
      key: 'solarized-light',
      type: 'light',
    },
  ];

  private constructor() {
    this.initializeTheme();
  }

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private initializeTheme() {
    try {
      // Check localStorage for saved theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && this.isValidTheme(savedTheme)) {
        this.currentTheme = savedTheme;
        console.log('Theme service: Loading saved theme:', savedTheme);
      } else {
        console.log('Theme service: No saved theme, using default:', this.currentTheme);
        // Set default theme in localStorage
        localStorage.setItem('theme', this.currentTheme);
      }
    } catch (error) {
      console.warn('Theme service: localStorage access failed, using default theme:', error);
      this.currentTheme = 'projectnest-default';
    }

    // Don't apply theme on initialization - let ThemeContext handle it
    console.log('Theme service: Initialized with theme:', this.currentTheme);
  }

  private isValidTheme(themeKey: string): boolean {
    return this.availableThemes.some(theme => theme.key === themeKey);
  }

  public async loadTheme(themeKey: string): Promise<ThemeConfig | null> {
    console.log('ThemeService: Loading theme:', themeKey);
    
    if (this.loadedThemes.has(themeKey)) {
      console.log('ThemeService: Theme already loaded from cache');
      return this.loadedThemes.get(themeKey) || null;
    }

    try {
      // Try to load theme from the public/themes folder
      const themeUrl = `/themes/${themeKey}.json`;
      console.log('ThemeService: Fetching theme from:', themeUrl);
      
      const response = await fetch(themeUrl);
      console.log('ThemeService: Fetch response status:', response.status);
      
      if (response.ok) {
        const themeConfig = await response.json() as ThemeConfig;
        console.log('ThemeService: Successfully loaded theme config:', themeConfig);
        this.loadedThemes.set(themeKey, themeConfig);
        return themeConfig;
      } else {
        console.warn('ThemeService: Failed to fetch theme, status:', response.status);
      }
    } catch (error) {
      console.warn(`ThemeService: Error loading theme ${themeKey}:`, error);
    }

    // Fallback to built-in themes
    console.log('ThemeService: Using built-in theme fallback for:', themeKey);
    const builtIn = this.getBuiltInTheme(themeKey);
    if (builtIn) {
      this.loadedThemes.set(themeKey, builtIn);
    }
    return builtIn;
  }

  private getBuiltInTheme(themeKey: string): ThemeConfig | null {
    const builtInThemes: Record<string, ThemeConfig> = {
      'projectnest-default': {
        name: 'ProjectNest Default',
        type: 'light',
        colors: {
          background: '0 0% 98%',
          foreground: '0 0% 10%',
          card: '0 0% 100%',
          cardForeground: '0 0% 15%',
          primary: '0 0% 20%',
          primaryForeground: '0 0% 98%',
          secondary: '0 0% 95%',
          secondaryForeground: '0 0% 25%',
          muted: '0 0% 96%',
          mutedForeground: '0 0% 45%',
          accent: '0 0% 92%',
          accentForeground: '0 0% 20%',
          border: '0 0% 88%',
          input: '0 0% 95%',
          ring: '0 0% 20%',
          destructive: '0 75% 55%',
          destructiveForeground: '0 0% 98%',
        },
      },
      'projectnest-dark': {
        name: 'ProjectNest Dark',
        type: 'dark',
        colors: {
          background: '222.2 84% 4.9%',
          foreground: '210 40% 98%',
          card: '222.2 47.4% 11.2%',
          cardForeground: '210 40% 98%',
          primary: '210 40% 98%',
          primaryForeground: '222.2 84% 4.9%',
          secondary: '217.2 32.6% 17.5%',
          secondaryForeground: '210 40% 98%',
          muted: '217.2 32.6% 17.5%',
          mutedForeground: '215 20.2% 65.1%',
          accent: '217.2 32.6% 17.5%',
          accentForeground: '210 40% 98%',
          border: '217.2 32.6% 17.5%',
          input: '217.2 32.6% 17.5%',
          ring: '210 40% 98%',
          destructive: '0 62.8% 30.6%',
          destructiveForeground: '210 40% 98%',
        },
      },
      'solarized-light': {
        name: 'Solarized Light',
        type: 'light',
        colors: {
          background: '41 48% 92%', // #F5EFE7 converted
          foreground: '14 28% 19%', // #3E2723 converted
          card: '36 24% 86%',       // #E8DFD0 converted
          cardForeground: '14 28% 19%',
          primary: '47 24% 48%',    // #9B8F5E converted
          primaryForeground: '0 0% 100%',
          secondary: '42 29% 89%',  // #EBE3D5 converted
          secondaryForeground: '14 28% 19%',
          muted: '35 19% 80%',      // #D9CDBF converted
          mutedForeground: '36 23% 44%', // #8B7355 converted
          accent: '47 24% 48%',
          accentForeground: '0 0% 100%',
          border: '35 19% 80%',
          input: '36 24% 86%',
          ring: '47 24% 48%',
          destructive: '11 35% 57%', // #C4756C converted
          destructiveForeground: '0 0% 100%',
        },
      },
    };

    return builtInThemes[themeKey] || null;
  }

  public async applyTheme(themeKey: string): Promise<void> {
    console.log('Theme service: Applying theme:', themeKey);
    const theme = await this.loadTheme(themeKey);
    if (!theme) {
      console.warn(`Theme ${themeKey} not found, using default`);
      return;
    }

    console.log('Theme service: Loaded theme config:', theme);
    const root = document.documentElement;

    // Apply dark/light class
    if (theme.type === 'dark') {
      console.log('Theme service: Adding dark class');
      root.classList.add('dark');
    } else {
      console.log('Theme service: Removing dark class');
      root.classList.remove('dark');
    }

    // Clear any existing custom properties first
    const existingProps = [
      'background', 'foreground', 'card', 'card-foreground', 
      'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 
      'muted', 'muted-foreground', 'accent', 'accent-foreground', 
      'border', 'input', 'ring', 'destructive', 'destructive-foreground'
    ];
    existingProps.forEach(prop => {
      root.style.removeProperty(`--${prop}`);
    });

    // Apply new CSS custom properties
    if (theme.colors) {
      console.log('Theme service: Applying CSS custom properties:', theme.colors);
      Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVar = this.convertToCSSVariable(key);
        const convertedValue = this.convertColorToTailwindFormat(value);
        console.log(`Setting ${cssVar} = ${convertedValue} (from ${value})`);
        root.style.setProperty(cssVar, convertedValue);
      });
    }

    this.currentTheme = themeKey;
    
    // Try to save to localStorage with error handling
    try {
      localStorage.setItem('theme', themeKey);
      console.log('Theme service: Theme saved to localStorage');
    } catch (error) {
      console.warn('Theme service: Failed to save theme to localStorage:', error);
    }
    
    console.log('Theme service: Theme applied successfully. Current classes:', root.className);
    console.log('Theme service: CSS custom properties set:', 
      existingProps.map(prop => `--${prop}: ${root.style.getPropertyValue(`--${prop}`)}`));
  }

  private convertToCSSVariable(key: string): string {
    // Convert camelCase to kebab-case and add CSS variable prefix
    const kebabCase = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `--${kebabCase}`;
  }

  private convertColorToTailwindFormat(color: string): string {
    // Convert different color formats to Tailwind's expected format
    if (color.startsWith('hsl(')) {
      // Extract values from hsl(h, s%, l%) format
      const match = color.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
      if (match) {
        return `${match[1]} ${match[2]}% ${match[3]}%`;
      }
    } else if (color.startsWith('#')) {
      // Convert hex to HSL format for Tailwind
      return this.hexToTailwindHSL(color);
    }
    
    // If it's already in the correct format or unknown, return as-is
    return color;
  }

  private hexToTailwindHSL(hex: string): string {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Convert to RGB first
    const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    
    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number, l: number;
    
    l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    
    // Convert to degrees and percentages
    const hDeg = Math.round(h * 360);
    const sPercent = Math.round(s * 100);
    const lPercent = Math.round(l * 100);
    
    return `${hDeg} ${sPercent}% ${lPercent}%`;
  }

  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  public async getAvailableThemes(): Promise<Theme[]> {
    console.log('ThemeService: Returning predefined themes');
    // Return only our 3 predefined themes - no API calls
    return this.availableThemes;
  }

  public preloadThemes(themeKeys: string[]): Promise<void[]> {
    return Promise.all(
      themeKeys.map(async (key) => {
        await this.loadTheme(key);
      })
    );
  }
}

export default ThemeService.getInstance();