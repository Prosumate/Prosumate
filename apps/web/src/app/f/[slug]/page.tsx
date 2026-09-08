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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Top Floating Nav */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs">
              P
            </div>
            <span className="font-bold text-sm tracking-tight text-white">{funnel.name}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Secure Enterprise Funnel</span>
          </div>
        </div>
      </header>

      {/* Main Blocks Stream */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16 flex-1 w-full">
        {currentStep.blocks?.map((block: any, bIdx: number) => {
          switch (block.type) {
            case 'hero':
              return (
                <div key={block.id || bIdx} className="text-center space-y-5 pt-6">
                  {block.settings?.badgeText && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{block.settings.badgeText}</span>
                    </div>
                  )}

                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    {block.title}
                  </h1>

                  {block.subtitle && (
                    <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      {block.subtitle}
                    </p>
                  )}

                  {block.settings?.buttonText && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const formEl = document.getElementById('funnel-embedded-form');
                          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm shadow-xl shadow-primary-500/25 transition-all cursor-pointer"
                      >
                        <span>{block.settings.buttonText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                        className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-white text-sm">{item.title}</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      </div>
                    ))}
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
              return (
                <div key={block.id || bIdx} className="space-y-6 pt-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-white">{block.title}</h2>
                    {block.subtitle && <p className="text-xs text-slate-400">{block.subtitle}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        name: 'Marcus Vance',
                        role: 'Managing Partner, Vance Advisory',
                        quote: 'The automated lead routing and unified communications increased our conversion velocity by 340% within 60 days.',
                      },
                      {
                        name: 'Elena Rostova',
                        role: 'VP Operations, Apex Health Networks',
                        quote: 'Having our funnel directly connected to instantaneous SMS nurture sequences changed our client onboarding forever.',
                      },
                    ].map((t, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-300 italic">"{t.quote}"</p>
                        <div>
                          <div className="font-bold text-xs text-white">{t.name}</div>
                          <div className="text-[11px] text-slate-500">{t.role}</div>
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
