'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  hero: {
    image?: string | null;
    title?: string;
    subtitle?: string;
    enabled?: boolean;
    ctaText?: string;
    ctaLink?: string;
  };
  theme: any;
}

export function Hero({ hero, theme }: HeroProps) {
  if (!hero?.enabled) {
    return null;
  }

  const title = hero.title || 'The Art of Living';
  const subtitle = hero.subtitle || 'Curated collection for the discerning few';
  const ctaText = hero.ctaText || 'Explore Collection';
  const ctaLink = hero.ctaLink || '#products';

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        {hero.image ? (
          <>
            <Image
              src={hero.image}
              alt={title}
              fill
              priority
              loading="eager"
              className="object-cover"
              sizes="100vw"
            />
            {/* Cinematic gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${theme.backgroundColor}ee 0%, ${theme.backgroundColor}99 50%, ${theme.backgroundColor}66 100%)`,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}20 0%, ${theme.accentColor}20 50%, ${theme.backgroundColor} 100%)`,
            }}
          />
        )}

        {/* Grain texture */}
        <div className="absolute inset-0 grain" />

        {/* Decorative elements */}
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: theme.accentColor }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 mb-6 animate-fade-up opacity-0"
            style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
          >
            <div
              className="w-12 h-px"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <span
              className="text-xs uppercase tracking-[0.3em] font-medium"
              style={{ color: theme.textSecondaryColor }}
            >
              Welcome
            </span>
          </div>

          {/* Main Title */}
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] mb-8 animate-fade-up opacity-0"
            style={{
              color: theme.textColor,
              animationDelay: '150ms',
              animationFillMode: 'forwards',
            }}
          >
            <span className="block">{title.split(' ').slice(0, -1).join(' ')}</span>
            <span
              className="block italic"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title.split(' ').slice(-1)[0]}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed mb-10 max-w-2xl animate-fade-up opacity-0"
            style={{
              color: theme.textSecondaryColor,
              animationDelay: '300ms',
              animationFillMode: 'forwards',
            }}
          >
            {subtitle}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center gap-4 animate-fade-up opacity-0"
            style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}
          >
            <Link
              href={ctaLink}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-medium transition-all duration-500 hover:gap-5"
              style={{
                backgroundColor: theme.primaryColor,
              }}
            >
              <span>{ctaText}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in opacity-0"
        style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
      >
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: theme.textSecondaryColor }}
        >
          Scroll
        </span>
        <div
          className="w-px h-12 relative overflow-hidden"
          style={{ backgroundColor: theme.borderColor }}
        >
          <div
            className="absolute top-0 left-0 w-full h-1/2 animate-bounce"
            style={{ backgroundColor: theme.primaryColor }}
          />
        </div>
      </div>
    </section>
  );
}
