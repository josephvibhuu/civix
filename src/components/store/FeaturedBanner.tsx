"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";

export interface BannerItem {
  id: string;
  appId: string | null;
  title: string;
  subtitle: string;
  badgeText: string;
  bannerUrl: string;
  ctaText: string;
  ctaUrl: string;
  appName: string | null;
  appSlug: string | null;
  appCategory: string | null;
}

export default function FeaturedBanner({ initialBanners = [] }: { initialBanners?: BannerItem[] }) {
  const [banners, setBanners] = useState<BannerItem[]>(initialBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (initialBanners.length === 0) {
      fetch("/api/banners")
        .then((r) => r.json())
        .then((d) => {
          if (d.banners && d.banners.length > 0) setBanners(d.banners);
        })
        .catch(() => {});
    }
  }, [initialBanners]);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div 
      className="relative w-full overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#080d19] shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] flex items-end">
        {/* Background Image Carousel with Framer Motion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${current.bannerUrl})` }}
          >
            {/* Dramatic dark gradients overlay for PlayStation Store aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060911] via-[#060911]/70 to-[#060911]/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060911] via-[#060911]/60 to-transparent" />
            <div className="absolute top-0 right-0 h-full w-1/3 bg-cyan-500/5 blur-3xl pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Content Overlay */}
        <div className="relative z-10 w-full max-w-4xl p-6 sm:p-10 lg:p-12 flex flex-col justify-end">
          {/* Badge & Category */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-950/80 px-3 py-1 text-[11px] font-bold text-cyan-300 backdrop-blur-md uppercase tracking-wider shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              {current.badgeText}
            </span>
            {current.appCategory && (
              <span className="rounded-full bg-black/60 border border-zinc-700/80 px-3 py-1 text-[11px] font-mono font-medium text-zinc-300 backdrop-blur-md uppercase">
                {current.appCategory}
              </span>
            )}
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {current.title}
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-base text-zinc-300 max-w-2xl leading-relaxed drop-shadow">
            {current.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* 1-Click Launch Button */}
            <a
              href={current.ctaUrl}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-6 py-3 text-xs sm:text-sm font-extrabold text-black shadow-xl shadow-cyan-500/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <Zap className="h-4 w-4 fill-black stroke-black" />
              <span>{current.ctaText}</span>
              <span className="rounded bg-black/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-black">
                1-Click SSO
              </span>
            </a>

            {/* App Details Link if associated with app */}
            {current.appSlug && (
              <Link
                href={`/app/${current.appSlug}`}
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-black/60 backdrop-blur-md px-5 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:border-cyan-400 hover:text-white transition-all"
              >
                <span>Store Page</span>
                <ArrowRight className="h-4 w-4 text-cyan-400" />
              </Link>
            )}
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {banners.length > 1 && (
          <div className="absolute right-6 bottom-6 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-black/60 text-zinc-300 backdrop-blur-md hover:border-cyan-400 hover:text-white transition-colors"
              title="Previous Spotlight"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-black/60 text-zinc-300 backdrop-blur-md hover:border-cyan-400 hover:text-white transition-colors"
              title="Next Spotlight"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Slide Indicator Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50" : "w-2 bg-zinc-600/70 hover:bg-zinc-400"
                }`}
                title={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
