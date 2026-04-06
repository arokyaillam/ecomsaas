'use client';

import { StoreTheme } from '@/lib/store';

interface ThemeProviderProps {
  theme: StoreTheme;
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const cssVariables = `
    :root {
      --primary: ${theme.primaryColor};
      --secondary: ${theme.secondaryColor};
      --accent: ${theme.accentColor};
      --background: ${theme.backgroundColor};
      --surface: ${theme.surfaceColor};
      --text: ${theme.textColor};
      --text-secondary: ${theme.textSecondaryColor};
      --border: ${theme.borderColor};
      --radius: ${theme.borderRadius};
      --font-family: ${theme.fontFamily};
    }
  `;

  return (
    <>
      <style jsx global>{`
        ${cssVariables}
      `}</style>
      {children}
    </>
  );
}
