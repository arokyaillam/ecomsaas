import type { Metadata } from "next";
import { headers } from "next/headers";
import { getStoreByDomain } from "@/lib/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  const store = await getStoreByDomain(domain);
  
  return {
    title: store?.name || "EcomSaaS Storefront",
    description: "Modern e-commerce storefront",
    icons: store?.theme.faviconUrl ? { icon: store.theme.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  
  // Fetch store with theme
  const store = await getStoreByDomain(domain);
  
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
  
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <style>{`
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
          
          body {
            background-color: var(--background);
            color: var(--text);
            font-family: var(--font-family), system-ui, sans-serif;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
