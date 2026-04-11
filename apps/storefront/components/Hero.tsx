'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  hero?: {
    image?: string | null;
    title?: string;
    subtitle?: string;
    enabled?: boolean;
    ctaText?: string;
    ctaLink?: string;
  };
  theme?: any;
  store?: any;
  categories?: any[];
}

export function Hero({ hero, theme, store, categories = [] }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
      });
    };

    const hero = heroRef.current;
    if (hero) {
      hero.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (hero) {
        hero.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Support both old and new props
  const heroData = hero || store?.hero || {};
  const isEnabled = heroData.enabled !== false;

  if (!isEnabled) {
    return null;
  }

  const heroTitle = heroData.title || store?.hero?.title || 'BRUTALIST\nCOMMERCE';
  const heroSubtitle = heroData.subtitle || store?.hero?.subtitle || 'Raw. Honest. Unforgettable.';
  const ctaText = heroData.ctaText || store?.hero?.ctaText || 'EXPLORE SHOP';
  const ctaLink = heroData.ctaLink || store?.hero?.ctaLink || '/products';
  const heroImage = heroData.image || store?.hero?.image;

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden diagonal-grid noise"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large Gradient Orb */}
        <div
          className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />

        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-px absolute left-[20%]"
            style={{ background: 'var(--text-primary)' }}
          />
          <div
            className="h-full w-px absolute left-[40%]"
            style={{ background: 'var(--text-primary)' }}
          />
          <div
            className="h-full w-px absolute left-[60%]"
            style={{ background: 'var(--text-primary)' }}
          />
          <div
            className="h-full w-px absolute left-[80%]"
            style={{ background: 'var(--text-primary)' }}
          />
        </div>

        {/* Accent Line */}
        <div className="absolute top-1/2 left-0 w-1/3 h-[2px] bg-[var(--accent)]" />
      </div>

      {/* Background Image (if provided) */}
      {heroImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={heroTitle}
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[var(--bg-primary)]/70" />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text Content */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-4 opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div className="w-12 h-[2px] bg-[var(--accent)]" />
              <span className="text-caption text-[var(--accent)]">
                EST. 2024
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className="font-mono font-bold text-[var(--text-primary)] leading-[0.85] tracking-tight opacity-0 animate-fade-up"
              style={{
                fontSize: 'clamp(3rem, 12vw, 10rem)',
                animationDelay: '200ms',
                animationFillMode: 'forwards',
              }}
            >
              {heroTitle.split('\n').map((line: string, i: number) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p
              className="text-body-lg text-[var(--text-secondary)] max-w-md opacity-0 animate-fade-up"
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              {heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-wrap gap-4 pt-4 opacity-0 animate-fade-up"
              style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
            >
              <Link href={ctaLink} className="btn-brutalist">
                {ctaText}
              </Link>
              <Link href="/categories" className="btn-ghost">
                VIEW CATEGORIES
              </Link>
            </div>
          </div>

          {/* Right - Visual Element */}
          <div
            className="hidden lg:block relative opacity-0 animate-scale-in"
            style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
          >
            {/* Abstract Geometric Composition */}
            <div className="relative w-full aspect-square max-w-lg ml-auto">
              {/* Main Square */}
              <div
                className="absolute inset-[10%] border-4 border-[var(--text-primary)] bg-[var(--bg-secondary)] flex items-center justify-center"
                style={{
                  transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
              >
                <span
                  className="font-mono text-[8rem] font-bold text-[var(--text-primary)] opacity-20"
                >
                  01
                </span>
              </div>

              {/* Offset Square */}
              <div
                className="absolute inset-[10%] border-4 border-[var(--accent)] bg-transparent"
                style={{
                  transform: `translate(${-20 + mousePosition.x * 0.3}px, ${20 + mousePosition.y * 0.3}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
              />

              {/* Small Accent Square */}
              <div
                className="absolute bottom-[15%] left-[5%] w-24 h-24 bg-[var(--accent)]"
                style={{
                  transform: `translate(${mousePosition.x * 0.8}px, ${mousePosition.y * 0.8}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
              />

              {/* Text Label */}
              <div
                className="absolute top-[5%] right-[5%] font-mono text-sm text-[var(--text-muted)] uppercase tracking-wider"
              >
                COLLECTION<br />2024
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-0 animate-fade-up" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
        <span className="text-caption text-[var(--text-muted)]">SCROLL</span>
        <div className="w-[1px] h-16 bg-[var(--border)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--accent)] animate-bounce" />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-sm">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
              <span className="text-caption text-[var(--text-muted)] whitespace-nowrap">SHOP BY:</span>
              {categories.slice(0, 5).map((cat: any, index: number) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="whitespace-nowrap px-4 py-2 border-2 border-[var(--border)] text-[var(--text-secondary)] font-mono text-sm uppercase hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors opacity-0 animate-fade-up"
                  style={{ animationDelay: `${900 + index * 100}ms`, animationFillMode: 'forwards' }}
                >
                  {cat.nameEn || cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
