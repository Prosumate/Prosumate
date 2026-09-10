'use client';

import { useParams } from 'next/navigation';
import { ArrowRight, Check, Quote, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { getWebsiteTemplateDesign, WEBSITE_TEMPLATES } from '@/lib/website-templates';

export default function TemplatePreviewPage() {
  const params = useParams();
  const template = WEBSITE_TEMPLATES.find((item) => item.id === params?.templateId);
  if (!template) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Template not found.</main>;

  const design = getWebsiteTemplateDesign(template.id);
  const step = template.steps[0];
  const fontClass = design.headingFont === 'serif' ? 'font-serif' : design.headingFont === 'condensed' ? 'font-black uppercase tracking-tight' : 'font-sans';
  const cardClass = design.sectionStyle === 'lines' ? 'border-y border-current/15' : design.sectionStyle === 'minimal' ? '' : design.sectionStyle === 'floating' ? 'rounded-[2rem] shadow-2xl' : 'rounded-2xl border border-current/10';

  return <div className="min-h-screen" style={{ background: design.surface, color: design.foreground }}>
    <header className="sticky top-0 z-20 border-b border-current/10 bg-inherit/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"><div className="flex items-center gap-2 font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: template.accentColor }}>{template.name.charAt(0)}</span>{template.name}</div><div className="flex items-center gap-5 text-xs"><span className="hidden items-center gap-1.5 opacity-60 sm:flex"><ShieldCheck className="h-4 w-4" />Trusted provider</span><button className="rounded-full px-5 py-2.5 font-bold text-white" style={{ background: template.accentColor }}>Get started</button></div></div></header>
    <main className={`mx-auto max-w-7xl px-6 ${design.layout === 'poster' ? 'space-y-8 py-8' : 'space-y-20 py-12'}`}>
      {step.blocks.map((block, index) => {
        const settings = block.settings || {};
        if (block.type === 'hero') {
          const background = design.layout === 'showcase';
          return <section key={index} className={`${background ? 'relative min-h-[680px] overflow-hidden rounded-[2.5rem]' : ''}`} style={background ? { backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.88),rgba(0,0,0,.15)),url(${settings.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><div className={`${design.layout === 'centered' ? 'mx-auto max-w-4xl text-center' : design.layout === 'editorial' ? 'grid items-end gap-10 lg:grid-cols-[1.3fr_.7fr]' : design.layout === 'poster' ? 'grid min-h-[560px] items-center gap-8 border-8 border-current p-8 lg:grid-cols-2' : background ? 'flex min-h-[680px] max-w-2xl flex-col justify-end p-10 sm:p-16' : 'grid items-center gap-12 lg:grid-cols-2'} ${background ? 'text-white' : ''}`}>
            <div className={design.layout === 'centered' ? 'mx-auto' : ''}><span className="inline-flex rounded-full border border-current/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: template.accentColor }}>{settings.badgeText || template.badge}</span><h1 className={`${fontClass} mt-6 ${design.layout === 'poster' ? 'text-6xl sm:text-8xl' : 'text-5xl sm:text-7xl'} leading-[.95]`}>{block.title}</h1><p className="mt-6 max-w-2xl text-base leading-7 opacity-70">{block.subtitle}</p><button className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: template.accentColor }}>{settings.buttonText || 'Get started'}<ArrowRight className="h-4 w-4" /></button></div>
            {!background && settings.imageUrl && <div className={`${design.layout === 'centered' ? 'mt-10' : ''} overflow-hidden ${design.layout === 'editorial' ? 'aspect-[3/4] rounded-t-full' : design.layout === 'poster' ? 'aspect-square rotate-2' : 'aspect-[4/3] rounded-[2rem]'}`}><img src={String(settings.imageUrl)} alt={block.title} className="h-full w-full object-cover" /></div>}
          </div></section>;
        }
        if (block.type === 'features' || block.type === 'container' || block.type === 'columns') {
          const items = (settings.items || settings.columns || []) as any[];
          return <section key={index} className={`${cardClass} p-6 sm:p-10`}><div className={design.layout === 'editorial' ? 'grid gap-10 lg:grid-cols-3' : ''}><div><div className="text-xs font-bold uppercase tracking-[.2em]" style={{ color: template.accentColor }}>Why choose us</div><h2 className={`${fontClass} mt-3 text-3xl sm:text-5xl`}>{block.title}</h2><p className="mt-3 opacity-60">{block.subtitle}</p></div><div className={`${design.layout === 'editorial' ? 'lg:col-span-2' : 'mt-8'} grid gap-4 md:grid-cols-2 lg:grid-cols-3`}>{items.map((item, itemIndex) => <article key={itemIndex} className={`${design.sectionStyle === 'minimal' ? 'border-l-2 pl-5' : 'rounded-2xl bg-black/5 p-6'} space-y-3`} style={design.sectionStyle === 'minimal' ? { borderColor: template.accentColor } : undefined}><Check className="h-5 w-5" style={{ color: template.accentColor }} /><h3 className="font-bold">{item.title}</h3><p className="text-sm leading-6 opacity-60">{item.description}</p></article>)}</div></div></section>;
        }
        if (block.type === 'testimonials') {
          const items = (settings.items || []) as any[];
          return <section key={index}><h2 className={`${fontClass} text-center text-4xl`}>{block.title}</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{items.map((item, itemIndex) => <article key={itemIndex} className={`${cardClass} bg-black/5 p-7`}><Quote className="h-7 w-7" style={{ color: template.accentColor }} /><p className="mt-4 leading-7 opacity-75">{item.quote || item.description}</p><div className="mt-5 flex gap-0.5">{[1,2,3,4,5].map((star) => <Star key={star} className="h-3.5 w-3.5 fill-current" style={{ color: template.accentColor }} />)}</div><div className="mt-3 text-sm font-bold">{item.name}</div></article>)}</div></section>;
        }
        return <section key={index} className={`${cardClass} p-10 text-center`}><Sparkles className="mx-auto h-6 w-6" style={{ color: template.accentColor }} /><h2 className={`${fontClass} mt-4 text-3xl sm:text-5xl`}>{block.title}</h2><p className="mx-auto mt-4 max-w-2xl opacity-60">{block.subtitle}</p>{settings.buttonText && <button className="mt-7 rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: template.accentColor }}>{String(settings.buttonText)}</button>}</section>;
      })}
    </main>
    <footer className="mt-16 border-t border-current/10 px-6 py-10 text-center text-xs opacity-50">Preview of {template.name} · Built with Prosumate</footer>
  </div>;
}
