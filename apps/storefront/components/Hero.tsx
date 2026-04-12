'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

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
          className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-15 blur-[150px] transition-transform duration-700 ease-out"
          style={{
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        />

        {/* Secondary orb */}
        <div
          className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, var(--text-primary) 0%, transparent 70%)',
            transform: `translate(${-mousePosition.x * 0.5}px, ${-mousePosition.y * 0.5}px)`,
            transition: 'transform 0.7s ease-out',
          }}
        />

        {/* Vertical Lines - Animated */}
        <div className="absolute inset-0 opacity-[0.08]">
          {[20, 40, 60, 80].map((percent, i) => (
            <div
              key={percent}
              className="h-full w-px absolute bg-[var(--text-primary)]"
              style={{
                left: `${percent}%`,
                opacity: isVisible ? 1 : 0,
                transition: `opacity 1s ease ${i * 200}ms`,
              }}
            />
          ))}
        </div>

        {/* Horizontal accent line */}
        <div
          className="absolute top-1/2 left-0 h-[2px] bg-[var(--accent)] origin-left"
          style={{
            width: isVisible ? '33%' : '0%',
            transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
          }}
        />
      </div>

      {/* Background Image (if provided) */}
      {heroImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={heroTitle}
            fill
            priority
            className="object-cover opacity-20"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[var(--bg-primary)]/80" />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Text Content */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <div
              className={`flex items-center gap-4 transition-all duration-700 ease-[var(--ease-smooth)] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              <div className="w-12 h-[2px] bg-[var(--accent)]" />
              <span className="text-caption text-[var(--accent)] tracking-[0.2em]">
                Est. 2024
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className={`font-mono font-bold text-[var(--text-primary)] leading-[0.85] tracking-tight transition-all duration-700 ease-[var(--ease-smooth)] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                fontSize: 'clamp(2.5rem, 10vw, 8rem)',
                transitionDelay: '200ms',
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
              className={`text-body-lg text-[var(--text-secondary)] max-w-md transition-all duration-700 ease-[var(--ease-smooth)] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              {heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-wrap gap-4 pt-4 transition-all duration-700 ease-[var(--ease-smooth)] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <Link href={ctaLink} className="btn-brutalist">
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/categories" className="btn-ghost">
                View Categories
              </Link>
            </div>
          </div>

          {/* Right - Visual Element */}
          <div
            className={`hidden lg:block relative transition-all duration-1000 ease-[var(--ease-smooth)] ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ transitionDelay: '500ms' }}
          >
            {/* Abstract Geometric Composition */}
            <div className="relative w-full aspect-square max-w-lg ml-auto">
              {/* Main Square */}
              <div
                className="absolute inset-[10%] border-[3px] border-[var(--text-primary)] bg-[var(--bg-secondary)] flex items-center justify-center"
                style={{
                  transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
              >
                <span className="font-mono text-[8rem] font-bold text-[var(--text-primary)] opacity-20">
                  01
                </span>
              </div>

              {/* Offset Square */}
              <div
                className="absolute inset-[10%] border-[3px] border-[var(--accent)] bg-transparent"
                style={{
                  transform: `translate(${-20 + mousePosition.x * 0.3}px, ${20 + mousePosition.y * 0.3}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
              />

              {/* Small Accent Square */}
              <div
                className="absolute bottom-[15%] left-[5%] w-20 h-20 bg-[var(--accent)]"
                style={{
                  transform: `translate(${mousePosition.x * 0.8}px, ${mousePosition.y * 0.8}px)`,
                  transition: 'transform 0.3s ease-out',
                }}
              />

              {/* Decorative lines */}
              <div className="absolute top-[5%] right-[10%] w-32 h-[2px] bg-[var(--border)]" />
              <div className="absolute top-[5%] right-[10%] w-[2px] h-20 bg-[var(--border)]" />

              {/* Text Label */}
              <div className="absolute top-[5%] right-[5%] font-mono text-xs text-[var(--text-muted)] uppercase tracking-[0.2em] text-right">
                Collection
                <br />
                2024
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 transition-all duration-700 ease-[var(--ease-smooth)] ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '800ms' }}
      >
        <span className="text-caption text-[var(--text-muted)] tracking-[0.2em]">Scroll</span>
        <div className="w-[1px] h-16 bg-[var(--border)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full bg-[var(--accent)] animate-bounce"
          style={{ height: '40%', animationDuration: '1.5s', animationTimingFunction: 'ease-in-out' }} />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-sm">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
              <span className="text-caption text-[var(--text-muted)] whitespace-nowrap tracking-wider">Shop By:</span>
              {categories.slice(0, 5).map((cat: any, index: number) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className={`whitespace-nowrap px-5 py-2.5 border-2 border-[var(--border)] text-[var(--text-secondary)] font-mono text-sm uppercase tracking-wider hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all duration-300 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{
                    transitionDelay: `${900 + index * 100}ms`,
                    transition: 'all 0.4s ease',
                  }}
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
