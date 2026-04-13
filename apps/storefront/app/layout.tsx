import type { Metadata } from "next";
import { headers } from "next/headers";
import { getStoreByDomain } from "@/lib/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/components/Providers";
import { SkipNav } from "@/components/SkipNav";
import "./globals.css";

// Force dynamic rendering for multi-tenant setup
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const headersList = await headers();
    const domain = headersList.get('x-store-domain') || 'localhost';
    const store = await getStoreByDomain(domain);

    const storeName = store?.name || "EcomSaaS Storefront";
    const description = store?.hero?.subtitle || "Discover amazing products at great prices";
    const url = `https://${domain}`;

    return {
      title: {
        default: storeName,
        template: `%s | ${storeName}`,
      },
      description,
      metadataBase: new URL(url),
      openGraph: {
        type: 'website',
        title: storeName,
        description,
        siteName: storeName,
        images: store?.hero?.image ? [{ url: store.hero.image }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: storeName,
        description,
        images: store?.hero?.image ? [store.hero.image] : undefined,
      },
      icons: store?.theme?.faviconUrl ? { icon: store.theme.faviconUrl } : undefined,
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch {
    return {
      title: "EcomSaaS Storefront",
      description: "Modern e-commerce storefront",
      robots: { index: true, follow: true },
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

  // Warm Minimalist Design System - Consistent across all stores
  const safeTheme = {
    primaryColor: '#e85d4c',
    secondaryColor: '#6366f1',
    accentColor: '#e85d4c',
    backgroundColor: '#faf8f5',
    surfaceColor: '#ffffff',
    textColor: '#1a1a1a',
    textSecondaryColor: '#4a4a4a',
    borderColor: '#e8e4dc',
    borderRadius: '12px',
    fontFamily: 'Satoshi, Inter, system-ui, sans-serif',
    logoUrl: store?.theme?.logoUrl || null,
    faviconUrl: store?.theme?.faviconUrl || null,
  };

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" style={{
        backgroundColor: 'var(--cream)',
        color: 'var(--charcoal)',
        fontFamily: 'var(--font-body)'
      }} suppressHydrationWarning>
        <SkipNav />

        {/* Live region for accessibility announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" />

        <ThemeProvider theme={safeTheme}>
          <Providers storeId={store?.id}>
            <div id="main-content" className="flex-1">
              {children}
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
