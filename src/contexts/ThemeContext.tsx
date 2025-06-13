import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get initial theme from localStorage or default to system
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'system';
  });
  
  // Track whether dark mode is active
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  // Function to set theme and save to localStorage
  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);
  
  // Apply theme when it changes
  React.useEffect(() => {
    const applyTheme = () => {
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemIsDark = darkQuery.matches;
      
      // Determine if we should use dark mode
      const shouldUseDark = 
        theme === 'dark' || 
        (theme === 'system' && systemIsDark);
      
      // Apply dark class to html element
      document.documentElement.classList.toggle('dark', shouldUseDark);
      setIsDarkMode(shouldUseDark);
    };
    
    // Apply theme immediately
    applyTheme();
    
    // Set up listener for system theme changes
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkQuery.addEventListener('change', applyTheme);
    
    return () => {
      darkQuery.removeEventListener('change', applyTheme);
    };
  }, [theme]);
  
  const value = React.useMemo(() => ({
    theme,
    setTheme,
    isDarkMode
  }), [theme, setTheme, isDarkMode]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};