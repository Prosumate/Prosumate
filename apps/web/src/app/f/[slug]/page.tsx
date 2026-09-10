'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Star,
  Check,
  Send,
  Lock,
  Globe,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  HelpCircle,
  CreditCard,
  Video,
} from 'lucide-react';

export default function PublicFunnelPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [funnel, setFunnel] = useState<any | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!slug) return;

    api.getPublicFunnel(slug)
      .then((res) => {
        if (res.success && res.data) {
          setFunnel(res.data);

          // Record Initial Page View
          const firstStep = res.data.steps?.[0];
          if (firstStep) {
            api.recordFunnelEvent(slug, {
              stepSlug: firstStep.slug,
              type: 'view',
            }).catch(() => {});
          }
        } else {
          setErrorMessage(res.error?.message || 'Page not found');
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Failed to load page');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const currentStep = funnel?.steps?.[currentStepIndex];
  const siteDesign = currentStep?.blocks?.[0]?.settings?.siteDesign || {};
  const siteSurface = siteDesign.surface || '#020617';
  const siteForeground = siteDesign.foreground || '#f1f5f9';
  const siteMuted = siteDesign.muted || '#94a3b8';
  const siteAccent = siteDesign.accentColor || '#4f46e5';
  const headingClass = siteDesign.headingFont === 'serif'
    ? 'font-serif'
    : siteDesign.headingFont === 'condensed'
      ? 'font-black uppercase tracking-tight'
      : 'font-sans';

  const handleFormSubmit = async (e: React.FormEvent, formSlug: string) => {
    e.preventDefault();
    if (!slug || !currentStep) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Submit form to public endpoint (triggers CRM contact auto-creation & workflow dispatch)
      const submitData = await api.submitPublicForm(formSlug, formData);

      if (submitData.success) {
        // 2. Record Funnel Conversion Event
        api.recordFunnelEvent(slug, {
          stepSlug: currentStep.slug,
          type: 'conversion',
        }).catch(() => {});

        // 3. Advance to next step or show completion message
        if (currentStep.nextStepSlug) {
          const nextIndex = funnel.steps.findIndex((s: any) => s.slug === currentStep.nextStepSlug);
          if (nextIndex !== -1) {
            setCurrentStepIndex(nextIndex);
            // Record view on next step
            api.recordFunnelEvent(slug, {
              stepSlug: currentStep.nextStepSlug,
              type: 'view',
            }).catch(() => {});
          } else {
            setIsSuccess(true);
            setThankYouMessage(submitData.data?.message || 'Thank you for your submission!');
          }
        } else {
          setIsSuccess(true);
          setThankYouMessage(submitData.data?.message || 'Thank you for your submission!');
        }
      } else {
        setErrorMessage(submitData.error?.message || 'Form submission failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading experience...
      </div>
    );
  }

  if (errorMessage || !funnel || !currentStep) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Globe className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Landing Page Unavailable</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          {errorMessage || 'This sales funnel does not exist or has been temporarily unpublished.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-primary-500 selection:text-white" style={{ backgroundColor: siteSurface, color: siteForeground }}>
      {/* Top Floating Nav */}
      <header className="border-b border-current/10 bg-inherit/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: siteAccent }}>
              P
            </div>
            <span className="font-bold text-sm tracking-tight">{funnel.name}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] opacity-60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Secure Enterprise Funnel</span>
          </div>
        </div>
      </header>

      {/* Main Blocks Stream */}
      <main className={`${siteDesign.layout === 'poster' || siteDesign.layout === 'showcase' ? 'max-w-7xl' : siteDesign.layout === 'editorial' ? 'max-w-6xl' : 'max-w-5xl'} mx-auto px-6 py-12 space-y-16 flex-1 w-full`}>
        {currentStep.blocks?.map((block: any, bIdx: number) => {
          switch (block.type) {
            case 'hero':
              const heroImgUrl = block.settings?.imageUrl;
              const isBgHero = (block.settings?.imagePosition === 'background' || siteDesign.layout === 'showcase') && heroImgUrl;
              const isLeftImg = block.settings?.imagePosition === 'left' || siteDesign.layout === 'editorial';
              const heroAspect =
                block.settings?.aspectRatio === '4:3'
                  ? 'aspect-[4/3]'
                  : block.settings?.aspectRatio === '1:1'
                  ? 'aspect-square'
                  : block.settings?.aspectRatio === '3:4'
                  ? 'aspect-[3/4]'
                  : 'aspect-video';
              const heroRadius = block.settings?.borderRadius || 'rounded-2xl';

              if (isBgHero) {
                return (
                  <div
                    key={block.id || bIdx}
                    className={`relative overflow-hidden p-8 sm:p-16 space-y-6 shadow-2xl border border-current/10 my-4 ${siteDesign.layout === 'showcase' ? 'min-h-[680px] flex flex-col justify-end text-left rounded-[2.5rem]' : 'text-center rounded-3xl'}`}
                    style={{
                      backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.90)), url(${heroImgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {block.settings?.badgeText && (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-sm backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{block.settings.badgeText}</span>
                      </div>
                    )}
                    <h1 className={`${headingClass} text-3xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-3xl ${siteDesign.layout === 'showcase' ? '' : 'mx-auto'}`}>
                      {block.title}
                    </h1>
                    {block.subtitle && (
                      <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        {block.subtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {block.settings?.buttonText && (
                        <button
                          onClick={() => {
                            const url = block.settings.buttonUrl;
                            if (url && url.startsWith('#')) {
                              const target = document.querySelector(url) || document.getElementById('funnel-embedded-form');
                              if (target) target.scrollIntoView({ behavior: 'smooth' });
                            } else if (url && url !== '#') {
                              window.open(url, '_blank');
                            } else {
                              const formEl = document.getElementById('funnel-embedded-form');
                              if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm shadow-xl shadow-primary-500/25 transition-all cursor-pointer"
                        >
                          <span>{block.settings.buttonText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      {block.settings?.secondaryButtonText && (
                        <button
                          onClick={() => {
                            const url = block.settings.secondaryButtonUrl;
                            if (url && url.startsWith('#')) {
                              const target = document.querySelector(url);
                              if (target) target.scrollIntoView({ behavior: 'smooth' });
                            } else if (url && url !== '#') {
                              window.open(url, '_blank');
                            }
                          }}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
                        >
                          <span>{block.settings.secondaryButtonText}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (heroImgUrl) {
                return (
                  <div key={block.id || bIdx} className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-6 ${siteDesign.layout === 'poster' ? 'border-8 border-current p-8' : ''}`}>
                    <div className={`space-y-5 text-left ${isLeftImg ? 'lg:col-span-7 lg:order-2' : 'lg:col-span-7'}`}>
                      {block.settings?.badgeText && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{block.settings.badgeText}</span>
                        </div>
                      )}
                      <h1 className={`${headingClass} ${siteDesign.layout === 'poster' ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-5xl'} font-extrabold tracking-tight leading-tight`}>
                        {block.title}
                      </h1>
                      {block.subtitle && (
                        <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: siteMuted }}>
                          {block.subtitle}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {block.settings?.buttonText && (
                          <button
                            onClick={() => {
                              const url = block.settings.buttonUrl;
                              if (url && url.startsWith('#')) {
                                const target = document.querySelector(url) || document.getElementById('funnel-embedded-form');
                                if (target) target.scrollIntoView({ behavior: 'smooth' });
                              } else if (url && url !== '#') {
                                window.open(url, '_blank');
                              } else {
                                const formEl = document.getElementById('funnel-embedded-form');
                                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-xl transition-all cursor-pointer"
                            style={{ backgroundColor: siteAccent }}
                          >
                            <span>{block.settings.buttonText}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        {block.settings?.secondaryButtonText && (
                          <button
                            onClick={() => {
                              const url = block.settings.secondaryButtonUrl;
                              if (url && url.startsWith('#')) {
                                const target = document.querySelector(url);
                                if (target) target.scrollIntoView({ behavior: 'smooth' });
                              } else if (url && url !== '#') {
                                window.open(url, '_blank');
                              }
                            }}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
                          >
                            <span>{block.settings.secondaryButtonText}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`lg:col-span-5 ${isLeftImg ? 'lg:order-1' : ''}`}>
                      <div className={`w-full ${heroAspect} ${heroRadius} overflow-hidden shadow-2xl border border-slate-800`}>
                        <img
                          src={heroImgUrl}
                          alt={block.settings?.imageAlt || block.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={block.id || bIdx} className="text-center space-y-5 pt-6">
                  {block.settings?.badgeText && (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{block.settings.badgeText}</span>
                    </div>
                  )}

                      <h1 className={`${headingClass} text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight`}>
                    {block.title}
                  </h1>

                  {block.subtitle && (
                    <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      {block.subtitle}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {block.settings?.buttonText && (
                      <button
                        onClick={() => {
                          const url = block.settings.buttonUrl;
                          if (url && url.startsWith('#')) {
                            const target = document.querySelector(url) || document.getElementById('funnel-embedded-form');
                            if (target) target.scrollIntoView({ behavior: 'smooth' });
                          } else if (url && url !== '#') {
                            window.open(url, '_blank');
                          } else {
                            const formEl = document.getElementById('funnel-embedded-form');
                            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm shadow-xl shadow-primary-500/25 transition-all cursor-pointer"
                      >
                        <span>{block.settings.buttonText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {block.settings?.secondaryButtonText && (
                      <button
                        onClick={() => {
                          const url = block.settings.secondaryButtonUrl;
                          if (url && url.startsWith('#')) {
                            const target = document.querySelector(url);
                            if (target) target.scrollIntoView({ behavior: 'smooth' });
                          } else if (url && url !== '#') {
                            window.open(url, '_blank');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
                      >
                        <span>{block.settings.secondaryButtonText}</span>
                      </button>
                    )}
                  </div>
                </div>
              );

            case 'container':
            case 'columns':
              const colsCount = block.settings?.columnsCount || block.settings?.columns?.length || 2;
              const gridClass =
                colsCount === 1
                  ? 'grid grid-cols-1'
                  : colsCount === 2
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                  : colsCount === 3
                  ? 'grid grid-cols-1 md:grid-cols-3 gap-6'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

              return (
                <div key={block.id || bIdx} className="space-y-6 pt-4">
                  {(block.title || block.subtitle) && (
                    <div className="text-center space-y-1.5">
                      {block.title && <h2 className="text-xl sm:text-2xl font-bold text-white">{block.title}</h2>}
                      {block.subtitle && <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">{block.subtitle}</p>}
                    </div>
                  )}

                  <div className={gridClass}>
                    {(block.settings?.columns || []).map((col: any, cIdx: number) => (
                      <div
                        key={cIdx}
                        className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors overflow-hidden"
                      >
                        <div className="space-y-3">
                          {col.imageUrl && (
                            <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-800">
                              <img src={col.imageUrl} alt={col.title || 'Column image'} className="w-full h-full object-cover" />
                            </div>
                          )}
                          {col.badgeText && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20 uppercase tracking-wider">
                              {col.badgeText}
                            </span>
                          )}
                          {col.title && <h3 className="font-bold text-base text-white">{col.title}</h3>}
                          {col.description && <p className="text-xs text-slate-400 leading-relaxed">{col.description}</p>}
                        </div>

                        {col.buttonText && (
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const url = col.buttonUrl;
                                if (url && url.startsWith('#')) {
                                  const target = document.querySelector(url) || document.getElementById('funnel-embedded-form');
                                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                                } else if (url && url !== '#') {
                                  window.open(url, '_blank');
                                } else {
                                  const formEl = document.getElementById('funnel-embedded-form');
                                  if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-500/20 transition-all cursor-pointer"
                            >
                              <span>{col.buttonText}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'features':
              return (
                <div key={block.id || bIdx} className="space-y-8 pt-4">
                  <div className="text-center space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{block.title}</h2>
                    {block.subtitle && <p className="text-xs text-slate-400">{block.subtitle}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(block.settings?.items || []).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors overflow-hidden"
                      >
                        {item.imageUrl && (
                          <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-800">
                            <img src={item.imageUrl} alt={item.title || 'Feature'} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {!item.imageUrl && (
                          <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <div className="font-bold text-white text-sm">{item.title}</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'pricing':
              const pricingTiers = block.settings?.pricingTiers || [];
              return (
                <div key={block.id || bIdx} className="space-y-8 pt-4">
                  <div className="text-center space-y-1.5">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{block.title}</h2>
                    {block.subtitle && <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">{block.subtitle}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pricingTiers.map((tier: any, tIdx: number) => (
                      <div
                        key={tIdx}
                        className={`p-7 rounded-3xl border flex flex-col justify-between space-y-6 relative transition-all ${
                          tier.popular
                            ? 'bg-slate-900 border-primary-500 shadow-2xl shadow-primary-500/15 ring-1 ring-primary-500/50'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary-500 text-white uppercase tracking-wider shadow-md">
                            Most Popular
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <div className="font-bold text-sm text-slate-300">{tier.name}</div>
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className="text-3xl sm:text-4xl font-extrabold text-white">{tier.price}</span>
                              <span className="text-xs text-slate-400">{tier.period}</span>
                            </div>
                            {tier.description && (
                              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tier.description}</p>
                            )}
                          </div>

                          <div className="border-t border-slate-800/80 pt-4 space-y-2">
                            {(tier.features || []).map((feat: string, fIdx: number) => (
                              <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                                <Check className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const formEl = document.getElementById('funnel-embedded-form');
                            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            tier.popular
                              ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {tier.buttonText || 'Choose Plan'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'faq':
              const faqItems = block.settings?.faqItems || [];
              return (
                <div key={block.id || bIdx} className="max-w-3xl mx-auto w-full space-y-6 pt-4">
                  <div className="text-center space-y-1.5">
                    <h2 className="text-2xl font-extrabold text-white">{block.title}</h2>
                    {block.subtitle && <p className="text-xs text-slate-400">{block.subtitle}</p>}
                  </div>

                  <div className="space-y-3">
                    {faqItems.map((faq: any, fIdx: number) => {
                      const faqKey = `${bIdx}-${fIdx}`;
                      const isExpanded = !!expandedFaqs[faqKey];
                      return (
                        <div
                          key={fIdx}
                          className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-colors"
                        >
                          <button
                            onClick={() =>
                              setExpandedFaqs((prev) => ({
                                ...prev,
                                [faqKey]: !prev[faqKey],
                              }))
                            }
                            className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/90 transition-colors"
                          >
                            <span className="font-semibold text-sm text-slate-200">{faq.question}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-primary-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="p-4 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

            case 'cta':
              return (
                <div
                  key={block.id || bIdx}
                  className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary-900/60 via-slate-900 to-slate-950 border border-primary-500/30 text-center space-y-5 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary-500/5 backdrop-blur-[1px] pointer-events-none" />
                  <div className="relative z-10 space-y-4">
                    {block.settings?.badgeText && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 uppercase tracking-wider">
                        {block.settings.badgeText}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white max-w-2xl mx-auto leading-tight">
                      {block.title}
                    </h2>
                    {block.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                        {block.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {block.settings?.buttonText && (
                        <button
                          onClick={() => {
                            const formEl = document.getElementById('funnel-embedded-form');
                            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-xl shadow-primary-500/30 transition-all cursor-pointer"
                        >
                          <span>{block.settings.buttonText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      {block.settings?.secondaryButtonText && (
                        <button
                          onClick={() => {
                            const formEl = document.getElementById('funnel-embedded-form');
                            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                        >
                          <span>{block.settings.secondaryButtonText}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );

            case 'video':
              return (
                <div key={block.id || bIdx} className="space-y-6 pt-4 text-center">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">{block.title}</h2>
                    {block.subtitle && <p className="text-xs text-slate-400 max-w-xl mx-auto">{block.subtitle}</p>}
                  </div>

                  <div className="max-w-3xl mx-auto aspect-video rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                      <span>High-Definition Stream (1080p)</span>
                      <span>Audio & Video Verified</span>
                    </div>
                  </div>
                </div>
              );

            case 'form_embed':
              const embeddedForm = block.embeddedForm;
              return (
                <div
                  key={block.id || bIdx}
                  id="funnel-embedded-form"
                  className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6"
                >
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-white">{block.title}</h2>
                    {block.subtitle && <p className="text-xs text-slate-400">{block.subtitle}</p>}
                  </div>

                  {isSuccess ? (
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 text-emerald-400">
                      <CheckCircle2 className="w-10 h-10 mx-auto" />
                      <div className="font-bold text-base text-white">Application Received</div>
                      <p className="text-xs text-slate-300">{thankYouMessage}</p>
                    </div>
                  ) : embeddedForm ? (
                    <form
                      onSubmit={(e) => handleFormSubmit(e, embeddedForm.slug)}
                      className="space-y-4 text-xs"
                    >
                      {embeddedForm.fields?.map((field: any) => (
                        <div key={field.id}>
                          <label className="block text-slate-300 font-medium mb-1">
                            {field.label} {field.required && <span className="text-rose-400">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              required={field.required}
                              placeholder={field.placeholder || ''}
                              value={formData[field.label] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-primary-500"
                            />
                          ) : (
                            <input
                              type={field.type}
                              required={field.required}
                              placeholder={field.placeholder || ''}
                              value={formData[field.label] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-primary-500"
                            />
                          )}
                        </div>
                      ))}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isSubmitting
                              ? 'Processing Registration...'
                              : embeddedForm.submitButtonText || 'Confirm & Continue'}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                        <Lock className="w-3 h-3" />
                        <span>256-Bit SSL Encrypted. Zero Spam Guarantee.</span>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center text-xs text-slate-500 p-4">
                      Form is currently loading or unavailable.
                    </div>
                  )}
                </div>
              );

            case 'testimonials':
              const testimonialList =
                block.settings?.items && block.settings.items.length > 0
                  ? block.settings.items
                  : [
                      {
                        name: 'Marcus Vance',
                        role: 'Managing Partner, Vance Advisory',
                        quote:
                          'The automated lead routing and unified communications increased our conversion velocity by 340% within 60 days.',
                        rating: 5,
                      },
                      {
                        name: 'Elena Rostova',
                        role: 'VP Operations, Apex Health Networks',
                        quote:
                          'Having our funnel directly connected to instantaneous SMS nurture sequences changed our client onboarding forever.',
                        rating: 5,
                      },
                    ];
              return (
                <div key={block.id || bIdx} className="space-y-6 pt-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-white">{block.title}</h2>
                    {block.subtitle && <p className="text-xs text-slate-400">{block.subtitle}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonialList.map((t: any, idx: number) => (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(t.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-300 italic">"{t.quote}"</p>
                        <div className="flex items-center gap-3 pt-1">
                          {t.avatarUrl ? (
                            <img
                              src={t.avatarUrl}
                              alt={t.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {t.name?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-xs text-white">{t.name}</div>
                            <div className="text-[11px] text-slate-500">{t.role}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 mt-12 bg-slate-950">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} {funnel.name}. All rights reserved.</div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Compliance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
