import type { Metadata } from "next";
import { headers } from "next/headers";
import { getStoreByDomain } from "@/lib/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/components/Providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const headersList = await headers();
    const domain = headersList.get('x-store-domain') || 'localhost';
    const store = await getStoreByDomain(domain);

    return {
      title: store?.name || "EcomSaaS Storefront",
      description: "Modern e-commerce storefront",
      icons: store?.theme.faviconUrl ? { icon: store.theme.faviconUrl } : undefined,
    };
  } catch {
    return {
      title: "EcomSaaS Storefront",
      description: "Modern e-commerce storefront",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let store = null;

  try {
    const headersList = await headers();
    const domain = headersList.get('x-store-domain') || 'localhost';
    store = await getStoreByDomain(domain);
  } catch (error) {
    console.error('Failed to load store in layout:', error);
  }

  // Default theme if no store found
  const defaultTheme = {
    primaryColor: "#0ea5e9",
    secondaryColor: "#6366f1",
    accentColor: "#8b5cf6",
    backgroundColor: "#0f172a",
    surfaceColor: "#1e293b",
    textColor: "#f8fafc",
    textSecondaryColor: "#94a3b8",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontFamily: "Inter, sans-serif",
    logoUrl: null,
    faviconUrl: null,
  };

  const theme = store?.theme || defaultTheme;

  // Sanitize theme values to prevent CSS injection
  const sanitizeCssValue = (value: string | null | undefined, fallback: string): string => {
    if (!value) return fallback;
    // Only allow safe CSS values: hex colors, rgba/hsla functions, and simple values
    const str = value.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(str)) return str;
    if (/^(rgba?\(|hsla?\()\s*[\d\s,.%]+\)$/.test(str)) return str;
    if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(str)) return str;
    if (/^[a-zA-Z0-9\s,'"-]+$/.test(str) && !/[;{}]/.test(str)) return str;
    return fallback;
  };

  const safeTheme = {
    primaryColor: sanitizeCssValue(theme.primaryColor, defaultTheme.primaryColor),
    secondaryColor: sanitizeCssValue(theme.secondaryColor, defaultTheme.secondaryColor),
    accentColor: sanitizeCssValue(theme.accentColor, defaultTheme.accentColor),
    backgroundColor: sanitizeCssValue(theme.backgroundColor, defaultTheme.backgroundColor),
    surfaceColor: sanitizeCssValue(theme.surfaceColor, defaultTheme.surfaceColor),
    textColor: sanitizeCssValue(theme.textColor, defaultTheme.textColor),
    textSecondaryColor: sanitizeCssValue(theme.textSecondaryColor, defaultTheme.textSecondaryColor),
    borderColor: sanitizeCssValue(theme.borderColor, defaultTheme.borderColor),
    borderRadius: sanitizeCssValue(theme.borderRadius, defaultTheme.borderRadius),
    fontFamily: sanitizeCssValue(theme.fontFamily, defaultTheme.fontFamily),
    logoUrl: theme.logoUrl,
    faviconUrl: theme.faviconUrl,
  };

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=space-mono@400,700&f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --primary: ${safeTheme.primaryColor};
            --secondary: ${safeTheme.secondaryColor};
            --accent: ${safeTheme.accentColor};
            --background: ${safeTheme.backgroundColor};
            --surface: ${safeTheme.surfaceColor};
            --text: ${safeTheme.textColor};
            --text-secondary: ${safeTheme.textSecondaryColor};
            --border: ${safeTheme.borderColor};
            --radius: ${safeTheme.borderRadius};
            --font-family: ${safeTheme.fontFamily};
          }

          body {
            background-color: var(--background);
            color: var(--text);
            font-family: var(--font-family), system-ui, sans-serif;
          }

          @keyframes slide-in-right {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }

          .animate-slide-in-right {
            animation: slide-in-right 0.3s ease-out;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider theme={theme}>
          <Providers storeId={store?.id}>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
