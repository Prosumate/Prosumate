export interface TemplateBlock {
  type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'form_embed' | 'cta' | 'video' | 'container' | 'columns';
  title: string;
  subtitle?: string;
  settings?: {
    badgeText?: string;
    buttonText?: string;
    buttonVariant?: string;
    imageUrl?: string;
    imageAlt?: string;
    imagePosition?: 'right' | 'left' | 'background';
    aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4';
    borderRadius?: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full';
    items?: Array<{
      title?: string;
      description?: string;
      imageUrl?: string;
      name?: string;
      role?: string;
      avatarUrl?: string;
      quote?: string;
      rating?: number;
    }>;
    [key: string]: unknown;
  };
}

export interface TemplateStep {
  name: string;
  slug: string;
  type: 'opt_in' | 'sales' | 'checkout' | 'upsell' | 'thank_you';
  nextStepSlug?: string;
  blocks: TemplateBlock[];
}

export interface WebsiteTemplate {
  id: string;
  name: string;
  category: 'healthcare' | 'legal_finance' | 'home_services' | 'real_estate' | 'agency_b2b' | 'fitness_wellness' | 'automotive' | 'ecommerce' | 'education' | 'hospitality' | 'professional_services' | 'events' | 'technology' | 'nonprofit' | 'beauty';
  categoryLabel: string;
  badge: string;
  accentColor: string;
  thumbnailUrl: string;
  description: string;
  suggestedSlug: string;
  stepsCount: number;
  steps: TemplateStep[];
}

export interface WebsiteTemplateDesign {
  layout: 'split' | 'centered' | 'editorial' | 'poster' | 'showcase';
  surface: string;
  foreground: string;
  muted: string;
  headingFont: 'sans' | 'serif' | 'condensed';
  sectionStyle: 'cards' | 'lines' | 'floating' | 'minimal';
}

const TEMPLATE_DESIGNS: Record<string, WebsiteTemplateDesign> = {
  'template-dental-implants': { layout: 'split', surface: '#f0fdfa', foreground: '#083344', muted: '#155e75', headingFont: 'sans', sectionStyle: 'floating' },
  'template-medspa-aesthetics': { layout: 'centered', surface: '#fff7ed', foreground: '#431407', muted: '#9a3412', headingFont: 'serif', sectionStyle: 'minimal' },
  'template-law-firm': { layout: 'editorial', surface: '#fafaf9', foreground: '#1c1917', muted: '#57534e', headingFont: 'serif', sectionStyle: 'lines' },
  'template-roofing-solar': { layout: 'poster', surface: '#fffbeb', foreground: '#292524', muted: '#92400e', headingFont: 'condensed', sectionStyle: 'cards' },
  'template-plumbing-hvac': { layout: 'split', surface: '#eff6ff', foreground: '#172554', muted: '#1e40af', headingFont: 'sans', sectionStyle: 'cards' },
  'template-luxury-real-estate': { layout: 'showcase', surface: '#0c0a09', foreground: '#fafaf9', muted: '#d6d3d1', headingFont: 'serif', sectionStyle: 'minimal' },
  'template-b2b-growth-agency': { layout: 'poster', surface: '#09090b', foreground: '#fafafa', muted: '#a1a1aa', headingFont: 'sans', sectionStyle: 'floating' },
  'template-fitness-transformation': { layout: 'editorial', surface: '#18181b', foreground: '#ffffff', muted: '#d4d4d8', headingFont: 'condensed', sectionStyle: 'lines' },
  'template-cpa-tax-advisory': { layout: 'centered', surface: '#f8fafc', foreground: '#0f172a', muted: '#475569', headingFont: 'serif', sectionStyle: 'lines' },
  'template-auto-detailing-ppf': { layout: 'showcase', surface: '#030712', foreground: '#f9fafb', muted: '#9ca3af', headingFont: 'condensed', sectionStyle: 'floating' },
};

export function getWebsiteTemplateDesign(templateId: string): WebsiteTemplateDesign {
  if (TEMPLATE_DESIGNS[templateId]) return TEMPLATE_DESIGNS[templateId];
  const hash = templateId.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  const layouts: WebsiteTemplateDesign['layout'][] = ['split', 'centered', 'editorial', 'poster', 'showcase'];
  const headingFonts: WebsiteTemplateDesign['headingFont'][] = ['sans', 'serif', 'condensed'];
  const sectionStyles: WebsiteTemplateDesign['sectionStyle'][] = ['cards', 'lines', 'floating', 'minimal'];
  const palettes = [
    ['#fff7ed', '#431407', '#9a3412'], ['#f0fdf4', '#052e16', '#166534'],
    ['#eff6ff', '#172554', '#1e40af'], ['#fdf4ff', '#4a044e', '#86198f'],
    ['#020617', '#f8fafc', '#94a3b8'], ['#18181b', '#fafafa', '#a1a1aa'],
    ['#f8fafc', '#0f172a', '#475569'], ['#fffbeb', '#422006', '#a16207'],
  ];
  const palette = palettes[hash % palettes.length];
  return { layout: layouts[hash % layouts.length], surface: palette[0], foreground: palette[1], muted: palette[2], headingFont: headingFonts[hash % headingFonts.length], sectionStyle: sectionStyles[hash % sectionStyles.length] };
}

export interface NicheImagePreset {
  label: string;
  url: string;
}

export const NICHE_IMAGE_PRESETS: Record<string, NicheImagePreset[]> = {
  healthcare: [
    { label: 'Modern Dental Clinic', url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Doctor Consultation', url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Cosmetic Smile Care', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80' },
    { label: 'High-Tech Surgery', url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Friendly Dentist', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Bright Treatment Suite', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80' },
  ],
  fitness_wellness: [
    { label: 'Luxury MedSpa Interior', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Aesthetic Facial Care', url: 'https://images.unsplash.com/photo-1512290900672-1f0233331899?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Modern Athletic Gym', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80' },
    { label: 'CrossFit Training', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Personal Training Studio', url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Wellness Rejuvenation', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80' },
  ],
  home_services: [
    { label: 'Architectural Solar Roof', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Rooftop Solar Installation', url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Smart HVAC Climate Unit', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Technician Inspection', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Clean Energy Home', url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Modern Home Exterior', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80' },
  ],
  legal_finance: [
    { label: 'Corporate Law Boardroom', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Senior Attorney Meeting', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Financial Analytics Suite', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Wealth Advisory Consultation', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Skyscraper Executive Office', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Private Client Consultation', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80' },
  ],
  real_estate: [
    { label: 'Luxury Architectural Villa', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Modern Interior Living', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Infinity Pool & Sunset', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Contemporary Kitchen', url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Penthouse Skyline View', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Estate Front Facade', url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80' },
  ],
  agency_b2b: [
    { label: 'Collaborative Growth Agency', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80' },
    { label: 'SaaS Dashboard Analytics', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Strategy Brainstorming', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Product Design Sprint', url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Modern Tech Workspace', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Executive Team Briefing', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80' },
  ],
  automotive: [
    { label: 'Exotic Supercar Detailing', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Ceramic Coating Reflection', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Luxury Sports Studio', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Precision Polishing', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Hypercar Showroom', url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Custom Detailing Bay', url: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=1200&q=80' },
  ],
};

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Niches' },
  { id: 'healthcare', label: 'Healthcare & Dental' },
  { id: 'home_services', label: 'Home Services & Trades' },
  { id: 'legal_finance', label: 'Legal & Financial' },
  { id: 'real_estate', label: 'Real Estate & Properties' },
  { id: 'agency_b2b', label: 'Digital Agency & B2B' },
  { id: 'fitness_wellness', label: 'Fitness & MedSpa' },
  { id: 'automotive', label: 'Automotive & Detailing' },
  { id: 'ecommerce', label: 'Ecommerce & Retail' },
  { id: 'education', label: 'Education & Courses' },
  { id: 'hospitality', label: 'Hospitality & Travel' },
  { id: 'professional_services', label: 'Professional Services' },
  { id: 'events', label: 'Events & Entertainment' },
  { id: 'technology', label: 'Technology & SaaS' },
  { id: 'nonprofit', label: 'Nonprofit & Community' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
] as const;

const CORE_WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  // 1. Healthcare / Dental
  {
    id: 'template-dental-implants',
    name: 'Premier Dental Implant & Smile Studio',
    category: 'healthcare',
    categoryLabel: 'Healthcare & Dental',
    badge: 'Dental & Orthodontics',
    accentColor: '#06b6d4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'premier-dental-smile',
    description: 'High-converting lead funnel for cosmetic dentistry, full-arch dental implants, and Invisalign consultations.',
    stepsCount: 2,
    steps: [
      {
        name: 'Complimentary Smile Consultation',
        slug: 'consultation',
        type: 'opt_in',
        nextStepSlug: 'confirmed',
        blocks: [
          {
            type: 'hero',
            title: 'Restore Your Confident Smile in Just One Day',
            subtitle: 'Board-certified implant specialists and cosmetic dentists using 3D guided surgery. Schedule your free 3D digital smile scan and $1,500 treatment credit.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Board-Certified Dental Specialists',
              buttonText: 'Claim Your Free 3D Smile Scan',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Advanced Care Designed Around Your Comfort',
            subtitle: 'State-of-the-art restorative dental technology without pain or anxiety.',
            settings: {
              items: [
                {
                  title: 'Same-Day Dental Implants',
                  description: 'Walk in with missing or damaged teeth and leave with a permanently fixed, natural-looking smile in 24 hours.',
                },
                {
                  title: 'Invisalign Diamond Provider',
                  description: 'Discreet clear aligner orthodontic therapy tailored for adults and teens with accelerated 6-month timelines.',
                },
                {
                  title: 'Sleep & Sedation Dentistry',
                  description: 'Zero pain and zero anxiety. Safe, monitored twilight sleep sedation for completely stress-free visits.',
                },
                {
                  title: '0% Interest Financing',
                  description: 'Flexible in-house payment options and pre-approved monthly plans to make dream smiles affordable.',
                },
              ],
            },
          },
          {
            type: 'testimonials',
            title: 'Patient Smile Transformations',
            subtitle: 'Real reviews from patients who regained their chewing ability and confidence.',
            settings: {
              items: [
                {
                  name: 'Robert Henderson',
                  role: 'Full-Arch Implant Patient',
                  quote: 'I hid my teeth for over 15 years. The team was compassionate, the surgery was painless, and I can eat steak again without thinking twice!',
                  rating: 5,
                  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                },
                {
                  name: 'Dr. Emily Watson',
                  role: 'Cosmetic Veneers & Invisalign',
                  quote: 'The level of clinical precision and artistic attention to detail is unmatched. Worth every single penny.',
                  rating: 5,
                  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Schedule Your Private Consultation Today',
            subtitle: 'Limited consultation slots available this week. Lock in your complimentary 3D CT scan ($350 value).',
            settings: {
              buttonText: 'Book Your Smile Consultation',
            },
          },
        ],
      },
      {
        name: 'Consultation Confirmed',
        slug: 'confirmed',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Your Smile Consultation is Reserved!',
            subtitle: 'Our patient care coordinator will contact you via text/call within 2 business hours to finalize your appointment time.',
            settings: {
              badgeText: 'Appointment Request Received',
              buttonText: 'Return to Homepage',
            },
          },
        ],
      },
    ],
  },

  // 2. MedSpa & Aesthetics
  {
    id: 'template-medspa-aesthetics',
    name: 'Aura Medical Aesthetics & Wellness Spa',
    category: 'fitness_wellness',
    categoryLabel: 'Fitness & MedSpa',
    badge: 'Aesthetics & Wellness',
    accentColor: '#ec4899',
    thumbnailUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'aura-medical-aesthetics',
    description: 'Luxury aesthetic clinic template featuring Botox, dermal fillers, laser skin rejuvenation, and body contouring.',
    stepsCount: 2,
    steps: [
      {
        name: 'VIP Aesthetics Consultation',
        slug: 'vip-pass',
        type: 'opt_in',
        nextStepSlug: 'thank-you',
        blocks: [
          {
            type: 'hero',
            title: 'Natural Facial Rejuvenation & Non-Surgical Body Sculpting',
            subtitle: 'Physician-led luxury medspa delivering subtle, youth-restoring results. Receive $100 toward your first Botox or Hydrafacial treatment.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f0233331899?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Physician-Supervised Medical Spa',
              buttonText: 'Claim Your $100 VIP Voucher',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Signature Clinical Treatments',
            subtitle: 'FDA-cleared aesthetic technologies for radiant skin and sculpted contours.',
            settings: {
              items: [
                {
                  title: 'Botox & Dysport Neurotoxins',
                  description: 'Smooth forehead lines, crow’s feet, and frown lines with natural-looking precision dosing.',
                },
                {
                  title: 'HydraFacial Deluxe MD',
                  description: 'Deep pore extraction, glycolic peel, and antioxidant infusion for immediate red-carpet radiance.',
                },
                {
                  title: 'Morpheus8 RF Microneedling',
                  description: 'Stimulate deep collagen and tighten loose facial and neck tissue without surgery or downtime.',
                },
                {
                  title: 'Laser Hair & Vein Removal',
                  description: 'CoolGlide dual-wavelength laser technology safe and effective for all skin complexions and tones.',
                },
              ],
            },
          },
          {
            type: 'testimonials',
            title: 'Loved by Our VIP Clients',
            subtitle: 'Consistently rated 5-stars for gentle technique and natural-looking artistry.',
            settings: {
              items: [
                {
                  name: 'Claire Montgomery',
                  role: 'VIP Member',
                  quote: 'I look rested, refreshed, and 10 years younger. Nobody can tell I had anything done — they just ask what skincare I use!',
                  rating: 5,
                  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
                },
                {
                  name: 'Sofia Reyes',
                  role: 'Morpheus8 & Filler Client',
                  quote: 'The luxury atmosphere and physician expertise make this the premier aesthetics clinic in town.',
                  rating: 5,
                  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Unlock Your Complimentary Skin Analysis',
            subtitle: 'Experience customized beauty plans tailored specifically to your skin goals.',
            settings: {
              buttonText: 'Request VIP Appointment',
            },
          },
        ],
      },
      {
        name: 'Voucher Confirmed',
        slug: 'thank-you',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Your $100 Treatment Voucher Has Been Reserved',
            subtitle: 'Check your phone for confirmation SMS. Our clinical concierge will assist you with scheduling your VIP visit.',
            settings: {
              badgeText: 'VIP Voucher Active',
              buttonText: 'Return to Website',
            },
          },
        ],
      },
    ],
  },

  // 3. Legal & Professional
  {
    id: 'template-law-firm',
    name: 'Apex Trial Attorneys & Personal Injury Law',
    category: 'legal_finance',
    categoryLabel: 'Legal & Financial',
    badge: 'Legal Counsel',
    accentColor: '#8b5cf6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'apex-injury-law',
    description: 'High-authority personal injury and litigation legal template with free case evaluations and zero-fee guarantee.',
    stepsCount: 2,
    steps: [
      {
        name: 'Free Case Evaluation',
        slug: 'case-review',
        type: 'opt_in',
        nextStepSlug: 'submitted',
        blocks: [
          {
            type: 'hero',
            title: 'Relentless Representation. Over $75M+ Recovered For Injury Victims.',
            subtitle: 'If you were injured in an auto accident or catastrophic collision, do not settle with the insurance company alone. We fight for maximum financial recovery.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'No Fee Unless We Win Your Case',
              buttonText: 'Get Free Instant Case Evaluation',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Why Top Clients Trust Our Trial Lawyers',
            subtitle: 'Proven courtroom results against Fortune 500 insurance corporations.',
            settings: {
              items: [
                {
                  title: 'Zero Out-of-Pocket Expenses',
                  description: 'We advance all litigation and expert witness fees. You do not pay a penny until we win a settlement or verdict.',
                },
                {
                  title: '24/7 Rapid Response Team',
                  description: 'Immediate evidence preservation, accident reconstruction, and medical referral assistance around the clock.',
                },
                {
                  title: 'Proven Multi-Million Verdicts',
                  description: 'Track record of high-stakes trial victories and aggressive negotiation with corporate insurers.',
                },
                {
                  title: 'Dedicated Trial Specialists',
                  description: 'Direct communication with your lead attorney throughout every phase of discovery and trial.',
                },
              ],
            },
          },
          {
            type: 'testimonials',
            title: 'Client Settlement Recoveries',
            subtitle: 'Protecting families during their most challenging moments.',
            settings: {
              items: [
                {
                  name: 'Marcus Sterling',
                  role: '$2.4M Truck Accident Settlement',
                  quote: 'When the insurance company offered an insulting settlement, Apex took them to federal court and secured the financial future of my family.',
                  rating: 5,
                  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Speak Directly With An Attorney Today',
            subtitle: 'Strict statutes of limitations apply. Contact our trial counsel for an immediate case review.',
            settings: {
              buttonText: 'Start Free Case Review',
            },
          },
        ],
      },
      {
        name: 'Case Evaluation Received',
        slug: 'submitted',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Your Case Details Have Been Received',
            subtitle: 'Our senior trial attorney is reviewing your case and will reach out immediately to discuss legal options.',
            settings: {
              badgeText: 'Confidential Case Intake Confirmed',
              buttonText: 'Return to Practice Areas',
            },
          },
        ],
      },
    ],
  },

  // 4. Home Services / Roofing & Solar
  {
    id: 'template-roofing-solar',
    name: 'Titan Roofing, Solar & Exterior Solutions',
    category: 'home_services',
    categoryLabel: 'Home Services & Trades',
    badge: 'Roofing & Solar',
    accentColor: '#f59e0b',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'titan-roofing-solar',
    description: 'High-converting homeowner quote engine for roof replacements, storm restoration, and $0-down solar installs.',
    stepsCount: 2,
    steps: [
      {
        name: 'Free 50-Point Roof & Solar Inspection',
        slug: 'estimate',
        type: 'opt_in',
        nextStepSlug: 'thank-you',
        blocks: [
          {
            type: 'hero',
            title: 'Protect Your Home With A Lifetime Roofing System & $0 Down Solar',
            subtitle: 'Factory-certified GAF Master Elite installers. Comprehensive storm damage assessments, insurance claim support, and 50-year warranty protection.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Licensed, Bonded & 5-Star Rated',
              buttonText: 'Schedule Free Drone Roof Inspection',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'The Titan Homeowner Advantage',
            subtitle: 'Built to withstand hail, 130 MPH hurricane winds, and extreme heat.',
            settings: {
              items: [
                {
                  title: '50-Year Non-Prorated Warranty',
                  description: 'Complete manufacturer-backed warranty covering both materials and professional craftsmanship.',
                },
                {
                  title: 'Insurance Claim Advocates',
                  description: 'Our licensed public adjusters document all hail and wind loss to maximize your insurer replacement coverage.',
                },
                {
                  title: 'Same-Day HD Drone Scans',
                  description: 'Precision thermal imaging to identify hidden leaks without dangerous foot traffic on your roof.',
                },
                {
                  title: '$0 Out-of-Pocket Solar Savings',
                  description: 'Eliminate electric bills and lock in fixed energy rates with federal and local clean energy incentives.',
                },
              ],
            },
          },
          {
            type: 'testimonials',
            title: 'Neighborhood Homeowner Testimonials',
            subtitle: 'Thousands of roofs replaced across your community with zero delays.',
            settings: {
              items: [
                {
                  name: 'David & Lisa Vance',
                  role: 'Homeowners in Oak Ridge',
                  quote: 'After the spring hailstorm, Titan handled the entire insurance adjuster meeting and installed a gorgeous architectural roof in one single day!',
                  rating: 5,
                  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Lock In Your Free Storm Damage Inspection',
            subtitle: 'Receive a comprehensive photo report and written estimate at zero cost or obligation.',
            settings: {
              buttonText: 'Get Instant Estimate Now',
            },
          },
        ],
      },
      {
        name: 'Inspection Scheduled',
        slug: 'thank-you',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Inspection Request Confirmed!',
            subtitle: 'A certified roofing specialist has been assigned to your address and will call you shortly to confirm your inspection window.',
            settings: {
              badgeText: 'Fast Response Priority',
              buttonText: 'Back to Site',
            },
          },
        ],
      },
    ],
  },

  // 5. Home Services / Plumbing & HVAC
  {
    id: 'template-plumbing-hvac',
    name: 'RapidFlow 24/7 Emergency Plumbing & Climate',
    category: 'home_services',
    categoryLabel: 'Home Services & Trades',
    badge: 'Plumbing & HVAC',
    accentColor: '#3b82f6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'rapidflow-plumbing-hvac',
    description: 'High-urgency emergency service template with 60-minute dispatch, flat-rate pricing, and coupon vouchers.',
    stepsCount: 2,
    steps: [
      {
        name: 'Emergency Dispatch & Booking',
        slug: 'book-service',
        type: 'opt_in',
        nextStepSlug: 'dispatched',
        blocks: [
          {
            type: 'hero',
            title: '60-Minute Emergency Plumbing, Drain & HVAC Repair',
            subtitle: 'Burst pipe, clogged sewer, or failed AC? Licensed technicians dispatched immediately. Upfront flat-rate pricing — no overtime surprise fees.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: '24/7 Live Emergency Dispatch',
              buttonText: 'Dispatch Technician ($50 Off Coupon)',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Why Homeowners Choose RapidFlow',
            subtitle: 'Honest, licensed master tradesmen treating your home with white-glove respect.',
            settings: {
              items: [
                {
                  title: '60-Minute Guaranteed Arrival',
                  description: 'GPS-tracked service trucks fully stocked with parts to complete 95% of repairs on the initial visit.',
                },
                {
                  title: 'Upfront Flat-Rate Quotes',
                  description: 'Know the exact cost before work begins. No hidden travel surcharges or surprise hourly fees.',
                },
                {
                  title: 'HD Sewer Camera Inspection',
                  description: 'See the exact cause of blockages with live high-definition fiber-optic video diagnostics.',
                },
                {
                  title: '100% Satisfaction Guarantee',
                  description: 'If you are not completely satisfied with our repair, we return and resolve it free of charge.',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Claim Your $50 Off Service Coupon',
            subtitle: 'Mention online voucher to your technician upon arrival for instant savings.',
            settings: {
              buttonText: 'Book Fast Dispatch Now',
            },
          },
        ],
      },
      {
        name: 'Technician Dispatched',
        slug: 'dispatched',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Your Service Call Has Been Logged!',
            subtitle: 'Our dispatcher is routing the closest available technician to your home. You will receive an SMS with technician photo and live tracking.',
            settings: {
              badgeText: 'Tech En Route',
              buttonText: 'Call Dispatcher Directly',
            },
          },
        ],
      },
    ],
  },

  // 6. Real Estate & Luxury Living
  {
    id: 'template-luxury-real-estate',
    name: 'Vanguard Luxury Real Estate & Private Estates',
    category: 'real_estate',
    categoryLabel: 'Real Estate & Properties',
    badge: 'Luxury Real Estate',
    accentColor: '#10b981',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'vanguard-luxury-estates',
    description: 'Premier showcase template for luxury property developers, high-end brokerages, and private architectural estates.',
    stepsCount: 2,
    steps: [
      {
        name: 'Private Property Portfolio Showcase',
        slug: 'vip-collection',
        type: 'opt_in',
        nextStepSlug: 'portfolio-access',
        blocks: [
          {
            type: 'hero',
            title: 'Exclusive Off-Market Estates & Architectural Residences',
            subtitle: 'Access private pocket listings, waterfront estates, and luxury penthouses unavailable on public MLS databases.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Private Client Real Estate Advisory',
              buttonText: 'Request VIP Off-Market Portfolio',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Bespoke Advisory For High-Net-Worth Buyers & Sellers',
            subtitle: 'Discreet negotiation and international marketing power.',
            settings: {
              items: [
                {
                  title: 'Private Pocket Listings',
                  description: 'Access premier properties sold discreetly without public signages or internet listing syndications.',
                },
                {
                  title: 'VIP Chauffeured Property Tours',
                  description: 'Curated private showing itineraries tailored to your lifestyle, architectural, and school criteria.',
                },
                {
                  title: 'Institutional Valuation Analysis',
                  description: 'Data-driven comparative market valuation analyzing neighborhood price-per-square-foot momentum.',
                },
                {
                  title: 'Relocation & Legal Concierge',
                  description: 'Full coordination with tax advisors, family offices, and title attorneys for seamless settlements.',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Explore Private Portfolio Offerings',
            subtitle: 'Complete verification to receive our confidential luxury lookbook and upcoming listings.',
            settings: {
              buttonText: 'Unlock Private Lookbook',
            },
          },
        ],
      },
      {
        name: 'Portfolio Access Granted',
        slug: 'portfolio-access',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Your Private Portfolio Lookbook is Ready',
            subtitle: 'Your dedicated estate advisor will reach out with the secure access key to the off-market digital vault.',
            settings: {
              badgeText: 'Access Key Dispatched',
              buttonText: 'Return to Homepage',
            },
          },
        ],
      },
    ],
  },

  // 7. Digital Agency & B2B Consulting
  {
    id: 'template-b2b-growth-agency',
    name: 'RevenueEngine B2B Marketing & Sales Systems',
    category: 'agency_b2b',
    categoryLabel: 'Digital Agency & B2B',
    badge: 'B2B Growth & RevOps',
    accentColor: '#6366f1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'revenue-engine-b2b',
    description: 'Performance marketing, pipeline generation, and RevOps consulting funnel for enterprise service companies.',
    stepsCount: 2,
    steps: [
      {
        name: 'Enterprise Growth Audit',
        slug: 'growth-audit',
        type: 'opt_in',
        nextStepSlug: 'audit-confirmed',
        blocks: [
          {
            type: 'hero',
            title: 'We Build Predictable Revenue Engines For B2B Leaders',
            subtitle: 'Stop relying on referrals and cold outreach. We architect full-funnel acquisition systems that add $1M–$5M in pipeline velocity.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Performance-Guaranteed Pipeline Scale',
              buttonText: 'Request Custom Growth Blueprint',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Enterprise Acquisition Infrastructure',
            subtitle: 'The 4 pillars of scalable modern business generation.',
            settings: {
              items: [
                {
                  title: 'Paid Acquisition & Account-Based Ads',
                  description: 'Target high-intent decision-makers on LinkedIn and Google Search with laser precision messaging.',
                },
                {
                  title: 'Conversion Funnels & Landing Pages',
                  description: 'High-converting interactive funnels that turn cold enterprise prospects into booked executive discovery calls.',
                },
                {
                  title: 'AI Speed-to-Lead Follow-Up',
                  description: 'Automated 2-way SMS and email sequences that engage inbound leads within 60 seconds of submission.',
                },
                {
                  title: 'RevOps & Attribution Dashboards',
                  description: 'Full-funnel attribution tracking exactly which marketing dollar produced which closed enterprise deal.',
                },
              ],
            },
          },
          {
            type: 'testimonials',
            title: 'Case Studies & Revenue Velocity',
            subtitle: 'Measurable ROI validated by CFOs and founders.',
            settings: {
              items: [
                {
                  name: 'Jason Sterling',
                  role: 'CEO, CloudScale Solutions',
                  quote: 'RevenueEngine scaled our qualified sales pipeline from $300k/mo to $1.8M/mo within our first 90 days. Flawless execution.',
                  rating: 5,
                  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Discover Your Untapped Pipeline Potential',
            subtitle: 'Schedule a 30-minute growth diagnostic session with our principal growth architect.',
            settings: {
              buttonText: 'Book Strategy Diagnostic',
            },
          },
        ],
      },
      {
        name: 'Strategy Session Confirmed',
        slug: 'audit-confirmed',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Your Diagnostic Session is Scheduled!',
            subtitle: 'Please check your inbox for calendar invites and pre-meeting diagnostic questions.',
            settings: {
              badgeText: 'Session Locked In',
              buttonText: 'Back to Agency Site',
            },
          },
        ],
      },
    ],
  },

  // 8. Fitness & Performance Coaching
  {
    id: 'template-fitness-transformation',
    name: 'CrossIron Elite Strength & Transformation',
    category: 'fitness_wellness',
    categoryLabel: 'Fitness & MedSpa',
    badge: 'Fitness & Athletics',
    accentColor: '#e11d48',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'crossiron-fitness-coaching',
    description: 'High-energy 6-week fitness challenge and transformation bootcamp funnel with member transformation stories.',
    stepsCount: 2,
    steps: [
      {
        name: '6-Week Transformation Challenge',
        slug: '6-week-challenge',
        type: 'opt_in',
        nextStepSlug: 'challenge-accepted',
        blocks: [
          {
            type: 'hero',
            title: 'Lose 15–20 Lbs, Build Lean Muscle & Reclaim Your Energy in 42 Days',
            subtitle: 'Join our proven 6-Week Total Body Transformation Challenge. Personalized coaching, custom meal planning, and an unbeatable community.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Next Challenge Batch Starting Monday',
              buttonText: 'Apply For The 6-Week Challenge',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'What Is Included In The Challenge',
            subtitle: 'Everything you need to guarantee lifelong physical transformation.',
            settings: {
              items: [
                {
                  title: 'Unlimited High-Energy Coaching',
                  description: 'Expert trainers coaching your form on every repetition to prevent injury and maximize metabolic fat burn.',
                },
                {
                  title: 'Custom Macro & Nutrition Protocol',
                  description: 'Simple, delicious meal guidelines with zero starvation or bland food restrictions.',
                },
                {
                  title: 'Weekly InBody Body Composition Scans',
                  description: 'Accurate clinical measurements tracking exact fat loss, muscle gains, and metabolic rate improvements.',
                },
                {
                  title: '100% Accountability & Community',
                  description: 'Dedicated coach check-ins keeping you consistent when motivation dips.',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Only 12 Challenger Spots Available',
            subtitle: 'Secure your spot today before registration closes for this batch.',
            settings: {
              buttonText: 'Claim Your Spot Now',
            },
          },
        ],
      },
      {
        name: 'Application Received',
        slug: 'challenge-accepted',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Challenge Application Received!',
            subtitle: 'Our head coach will call you within 15 minutes to complete your orientation and schedule your baseline fitness scan.',
            settings: {
              badgeText: 'Application Approved',
              buttonText: 'Visit Community Group',
            },
          },
        ],
      },
    ],
  },

  // 9. Accounting & Tax Advisory
  {
    id: 'template-cpa-tax-advisory',
    name: 'CapitalGuard CPA & Strategic Wealth Advisory',
    category: 'legal_finance',
    categoryLabel: 'Legal & Financial',
    badge: 'Accounting & Tax',
    accentColor: '#059669',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'capitalguard-cpa-tax',
    description: 'Proactive tax reduction planning, fractional CFO services, and multi-entity wealth protection for business owners.',
    stepsCount: 2,
    steps: [
      {
        name: 'Proactive Tax Savings Assessment',
        slug: 'tax-assessment',
        type: 'opt_in',
        nextStepSlug: 'assessment-booked',
        blocks: [
          {
            type: 'hero',
            title: 'Legally Slash Your Business Taxes By $25k–$150k+ Every Single Year',
            subtitle: 'Most accountants just record history. We proactively architect legal entity structures and tax deductions that keep your hard-earned wealth in your pocket.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Licensed CPAs & Tax Strategists',
              buttonText: 'Schedule Strategic Tax Review',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Strategic Wealth & Tax Capabilities',
            subtitle: 'Proactive advisory built for business owners generating $500k to $20M+.',
            settings: {
              items: [
                {
                  title: 'Proactive Tax Optimization',
                  description: 'Multi-entity corporate structuring (S-Corp, LLC, Trusts) designed to minimize self-employment and income tax.',
                },
                {
                  title: 'Fractional CFO & Cash Flow Advisory',
                  description: 'Executive financial oversight, KPI dashboards, and cash flow forecasting without full-time executive overhead.',
                },
                {
                  title: 'Flawless Multi-Entity Bookkeeping',
                  description: 'Monthly reconciled financials, balance sheets, and real-time expense reporting synced to QuickBooks.',
                },
                {
                  title: 'Audit Defense & IRS Representation',
                  description: 'Direct representation before IRS and state authorities by licensed CPAs and enrolled agents.',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Discover Your Immediate Tax Savings',
            subtitle: 'Review your prior year tax returns with our senior strategist to uncover overlooked deductions.',
            settings: {
              buttonText: 'Book Free Tax Strategy Review',
            },
          },
        ],
      },
      {
        name: 'Review Scheduled',
        slug: 'assessment-booked',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Tax Strategy Consultation Confirmed',
            subtitle: 'A confirmation email with secure document upload link has been sent to your email address.',
            settings: {
              badgeText: 'Strategy Call Reserved',
              buttonText: 'Return to Website',
            },
          },
        ],
      },
    ],
  },

  // 10. Automotive Detailing & Ceramic Coatings
  {
    id: 'template-auto-detailing-ppf',
    name: 'Obsidian Precision Auto Styling & Detail Studio',
    category: 'automotive',
    categoryLabel: 'Automotive & Detailing',
    badge: 'Automotive Styling',
    accentColor: '#ea580c',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80',
    suggestedSlug: 'obsidian-auto-styling',
    description: 'High-end ceramic coating, self-healing paint protection film (PPF), and concourse paint correction showcase.',
    stepsCount: 2,
    steps: [
      {
        name: 'Ceramic Coating & PPF Quote',
        slug: 'quote',
        type: 'opt_in',
        nextStepSlug: 'quote-submitted',
        blocks: [
          {
            type: 'hero',
            title: 'Permanent Showroom Gloss & Rock Chip Protection For Your Vehicle',
            subtitle: 'Certified installers of 9H multi-year ceramic coatings, self-healing paint protection film, and multi-stage paint correction.',
            settings: {
              imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80',
              imagePosition: 'right',
              aspectRatio: '16:9',
              borderRadius: 'rounded-2xl',
              badgeText: 'Certified Ceramic Pro & XPEL Studio',
              buttonText: 'Get Instant Custom Vehicle Quote',
              buttonVariant: 'primary',
            },
          },
          {
            type: 'features',
            title: 'Precision Protection Services',
            subtitle: 'Protect your automotive investment from swirls, chips, and UV fading.',
            settings: {
              items: [
                {
                  title: 'XPEL Self-Healing PPF Film',
                  description: 'Invisible optical shield absorbing rock chips and road debris with heat-activated scratch self-healing.',
                },
                {
                  title: '9H Multi-Year Ceramic Coatings',
                  description: 'Hydrophobic nano-ceramic glass barrier that sheds water, dirt, and road grime with candy-like depth.',
                },
                {
                  title: 'Multi-Stage Paint Correction',
                  description: 'Machine polishing that permanently eliminates 90%+ of swirl marks, buffer trails, and micro-scratches.',
                },
                {
                  title: 'Interior Leather & Fabric Shield',
                  description: 'Deep steam decontamination and UV barrier preventing leather cracking and liquid staining.',
                },
              ],
            },
          },
          {
            type: 'cta',
            title: 'Protect Your Vehicle Today',
            subtitle: 'Receive a personalized package recommendation and written warranty quote within minutes.',
            settings: {
              buttonText: 'Request Vehicle Package Quote',
            },
          },
        ],
      },
      {
        name: 'Quote Request Confirmed',
        slug: 'quote-submitted',
        type: 'thank_you',
        blocks: [
          {
            type: 'hero',
            title: 'Your Vehicle Quote Request Has Been Received!',
            subtitle: 'Our master detailer is preparing your customized protection package based on your vehicle model and year.',
            settings: {
              badgeText: 'Quote Calculation in Progress',
              buttonText: 'Back to Studio Gallery',
            },
          },
        ],
      },
    ],
  },
];

type GeneratedNiche = [string, string, WebsiteTemplate['category'], string, string];

const GENERATED_NICHES: GeneratedNiche[] = [
  ['chiropractic-wellness', 'Chiropractic Wellness Center', 'healthcare', 'Pain-Free Movement Starts Here', 'Book Your Posture Assessment'],
  ['pediatric-clinic', 'Pediatric Family Clinic', 'healthcare', 'Healthcare That Helps Children Thrive', 'Schedule a Child Wellness Visit'],
  ['mental-health-therapy', 'Private Therapy Practice', 'healthcare', 'A Safer Space to Feel Like Yourself Again', 'Request a Confidential Consultation'],
  ['optometry-vision', 'Modern Vision & Optometry', 'healthcare', 'See Life More Clearly', 'Reserve Your Eye Examination'],
  ['veterinary-care', 'Compassionate Veterinary Care', 'healthcare', 'Exceptional Care for Every Member of Your Family', 'Book a Pet Health Visit'],
  ['mortgage-broker', 'Independent Mortgage Advisor', 'legal_finance', 'A Smarter Route to the Right Mortgage', 'Get My Free Mortgage Review'],
  ['estate-planning', 'Estate Planning Attorney', 'legal_finance', 'Protect Everything You Have Built', 'Plan My Family Legacy'],
  ['bookkeeping-firm', 'Cloud Bookkeeping Studio', 'legal_finance', 'Clean Books. Clear Decisions. More Growth.', 'Request a Financial Health Check'],
  ['insurance-agency', 'Independent Insurance Agency', 'legal_finance', 'Coverage Designed Around Your Real Life', 'Compare My Coverage'],
  ['wealth-management', 'Private Wealth Management', 'legal_finance', 'Build Wealth With Purpose and Confidence', 'Schedule a Portfolio Review'],
  ['landscaping-design', 'Landscape Design & Build', 'home_services', 'Turn Your Backyard Into Your Favorite Destination', 'Request a Landscape Concept'],
  ['kitchen-remodeling', 'Luxury Kitchen Remodeling', 'home_services', 'The Kitchen You Have Always Imagined', 'Plan My Kitchen Remodel'],
  ['pest-control', 'Family-Safe Pest Control', 'home_services', 'Pests Out. Peace of Mind In.', 'Get a Same-Day Inspection'],
  ['cleaning-service', 'Premium Home Cleaning', 'home_services', 'Come Home to Effortless Clean', 'Get My Instant Cleaning Quote'],
  ['pool-construction', 'Custom Pool Builder', 'home_services', 'Your Private Resort Starts in Your Backyard', 'Design My Dream Pool'],
  ['property-management', 'Residential Property Management', 'real_estate', 'Better Returns. Fewer Headaches.', 'Get a Free Rental Analysis'],
  ['first-time-homebuyer', 'First-Time Homebuyer Guide', 'real_estate', 'Your First Home Is Closer Than You Think', 'Start My Homebuyer Plan'],
  ['commercial-real-estate', 'Commercial Property Advisors', 'real_estate', 'Real Estate Decisions Built for Business Growth', 'Discuss My Property Strategy'],
  ['vacation-rentals', 'Boutique Vacation Rentals', 'real_estate', 'Stay Somewhere Worth Remembering', 'Explore Available Stays'],
  ['senior-living', 'Premium Senior Living Community', 'real_estate', 'A Vibrant Next Chapter Starts Here', 'Schedule a Private Tour'],
  ['branding-studio', 'Boutique Branding Studio', 'agency_b2b', 'Build a Brand People Remember', 'Start My Brand Transformation'],
  ['recruitment-agency', 'Executive Recruitment Firm', 'professional_services', 'The Right Leaders Change Everything', 'Discuss Your Next Hire'],
  ['business-consulting', 'Growth Strategy Consultancy', 'professional_services', 'Turn Complex Growth Into a Clear Plan', 'Book a Strategy Session'],
  ['virtual-assistant', 'Executive Virtual Assistant Agency', 'professional_services', 'Get Your Time and Focus Back', 'Meet Your Ideal Assistant'],
  ['architecture-firm', 'Modern Architecture Practice', 'professional_services', 'Spaces Designed Around How You Live', 'Discuss Your Project'],
  ['online-course', 'Signature Online Course Launch', 'education', 'Turn What You Know Into What You Are Known For', 'Join the Masterclass'],
  ['language-school', 'Immersive Language Academy', 'education', 'Speak With Confidence in the Real World', 'Take a Free Level Test'],
  ['coding-bootcamp', 'Career Coding Bootcamp', 'education', 'Launch Your Technology Career Faster', 'Apply for the Next Cohort'],
  ['music-lessons', 'Modern Music Academy', 'education', 'Learn the Music You Actually Love', 'Book a Trial Lesson'],
  ['tutoring-center', 'Academic Tutoring Center', 'education', 'Confidence Changes Everything at School', 'Get a Learning Assessment'],
  ['boutique-hotel', 'Boutique City Hotel', 'hospitality', 'Stay in the Heart of Something Special', 'Check Rooms & Rates'],
  ['destination-resort', 'Luxury Destination Resort', 'hospitality', 'Escape Into the Extraordinary', 'Design Your Stay'],
  ['travel-agency', 'Bespoke Travel Designer', 'hospitality', 'Journeys Designed Only for You', 'Plan My Dream Trip'],
  ['restaurant-launch', 'Chef-Led Restaurant', 'hospitality', 'A New Story on Every Plate', 'Reserve Your Table'],
  ['wedding-venue', 'Garden Wedding Venue', 'events', 'The Perfect Setting for Your Forever', 'Book a Private Venue Tour'],
  ['event-planner', 'Luxury Event Planning', 'events', 'Unforgettable Events, Effortlessly Delivered', 'Plan My Celebration'],
  ['conference-summit', 'Industry Conference & Summit', 'events', 'The Ideas and People Shaping Tomorrow', 'Secure My Conference Pass'],
  ['photography-studio', 'Editorial Photography Studio', 'events', 'Images That Feel Like You', 'View Packages & Availability'],
  ['subscription-box', 'Curated Subscription Box', 'ecommerce', 'A Little Joy, Delivered Every Month', 'Build My First Box'],
  ['fashion-boutique', 'Independent Fashion Boutique', 'ecommerce', 'Style That Does Not Follow the Crowd', 'Shop the New Collection'],
  ['organic-skincare', 'Organic Skincare Collection', 'beauty', 'Skincare Your Skin Understands', 'Find My Daily Ritual'],
  ['hair-salon', 'Luxury Hair Salon', 'beauty', 'Your Best Hair Starts With the Right Cut', 'Book Your Transformation'],
  ['barber-studio', 'Modern Barber Studio', 'beauty', 'Sharp Cuts. Timeless Confidence.', 'Reserve Your Chair'],
  ['mobile-app', 'Consumer Mobile App Launch', 'technology', 'One App. A Better Way to Get It Done.', 'Join the Early Access List'],
  ['b2b-saas', 'B2B SaaS Product', 'technology', 'Replace Busywork With Better Work', 'Start a Free Product Tour'],
  ['cybersecurity', 'Managed Cybersecurity Platform', 'technology', 'Secure Every Device, User, and Cloud', 'Get a Security Assessment'],
  ['ai-startup', 'AI Productivity Platform', 'technology', 'Your Best Work, Accelerated by AI', 'Try the AI Workspace'],
  ['charity-campaign', 'Nonprofit Giving Campaign', 'nonprofit', 'Together, One Gift Changes a Life', 'Make an Impact Today'],
  ['community-membership', 'Private Member Community', 'nonprofit', 'Find Your People. Build Something Meaningful.', 'Become a Founding Member'],
  ['yoga-retreat', 'Transformational Yoga Retreat', 'fitness_wellness', 'Return Home to Yourself', 'Reserve Your Retreat Place'],
];

const CATEGORY_LABELS: Record<WebsiteTemplate['category'], string> = {
  healthcare: 'Healthcare & Dental', legal_finance: 'Legal & Financial', home_services: 'Home Services & Trades',
  real_estate: 'Real Estate & Properties', agency_b2b: 'Digital Agency & B2B', fitness_wellness: 'Fitness & Wellness',
  automotive: 'Automotive & Detailing', ecommerce: 'Ecommerce & Retail', education: 'Education & Courses',
  hospitality: 'Hospitality & Travel', professional_services: 'Professional Services', events: 'Events & Entertainment',
  technology: 'Technology & SaaS', nonprofit: 'Nonprofit & Community', beauty: 'Beauty & Personal Care',
};

const EXTRA_TEMPLATE_IMAGES = [
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=82',
];

const GLOBAL_TEMPLATE_IMAGES = Object.keys(NICHE_IMAGE_PRESETS)
  .reduce<string[]>((images, key) => images.concat(NICHE_IMAGE_PRESETS[key].map((preset) => preset.url)), [])
  .concat(EXTRA_TEMPLATE_IMAGES);

function createGeneratedTemplate(niche: GeneratedNiche, index: number): WebsiteTemplate {
  const [id, name, category, headline, cta] = niche;
  const pageCount = 2 + (index % 4);
  const categoryImages = (NICHE_IMAGE_PRESETS[category] || []).map((preset) => preset.url);
  const uniqueTemplateImage = GLOBAL_TEMPLATE_IMAGES[index % GLOBAL_TEMPLATE_IMAGES.length];
  const pageImages = [uniqueTemplateImage, ...categoryImages, ...GLOBAL_TEMPLATE_IMAGES.slice(index + 1), ...GLOBAL_TEMPLATE_IMAGES.slice(0, index + 1)];
  const accentColors = ['#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#e11d48', '#ca8a04', '#06b6d4', '#ec4899'];
  const journeyNames = ['Discover', 'Our Approach', 'Solutions', 'Success Stories', 'Get Started'];
  const steps: TemplateStep[] = Array.from({ length: pageCount }, (_, pageIndex) => {
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === pageCount - 1;
    const slug = isFirst ? 'welcome' : isLast ? 'thank-you' : journeyNames[pageIndex].toLowerCase().replaceAll(' ', '-');
    const nextSlug = pageIndex + 1 === pageCount - 1 ? 'thank-you' : journeyNames[pageIndex + 1]?.toLowerCase().replaceAll(' ', '-');
    return {
      name: isFirst ? `${name} Landing Page` : isLast ? 'Thank You & Next Steps' : journeyNames[pageIndex],
      slug,
      type: isFirst ? 'opt_in' : isLast ? 'thank_you' : pageIndex === pageCount - 2 ? 'sales' : 'upsell',
      nextStepSlug: isLast ? undefined : nextSlug,
      blocks: isLast ? [{
        type: 'hero', title: 'You Are One Step Closer', subtitle: `Thank you for choosing ${name}. Our team will contact you with the next steps shortly.`,
        settings: { badgeText: 'Request Received', buttonText: 'Return to Home', imagePosition: 'background', imageUrl: pageImages[pageIndex % pageImages.length] },
      }] : [{
        type: 'hero', title: isFirst ? headline : `${journeyNames[pageIndex]} With ${name}`,
        subtitle: isFirst ? `A purpose-built experience for people who expect better. Discover why clients trust ${name}.` : `Explore a focused path designed to help you make a confident decision.`,
        settings: { badgeText: CATEGORY_LABELS[category], buttonText: isFirst ? cta : 'Continue', imageUrl: pageImages[pageIndex % pageImages.length], imagePosition: ['right', 'left', 'background'][index % 3] as 'right' | 'left' | 'background', borderRadius: index % 2 ? 'rounded-3xl' : 'rounded-xl' },
      }, {
        type: 'features', title: isFirst ? `Why Clients Choose ${name}` : `What Makes Our ${journeyNames[pageIndex]} Different`, subtitle: 'Clear benefits, thoughtful service, and measurable outcomes.',
        settings: { items: [
          { title: 'Personalized Experience', description: 'Every recommendation is shaped around your goals, priorities, and timeline.' },
          { title: 'Trusted Expertise', description: 'Work with specialists who combine proven methods with attentive service.' },
          { title: 'Clear Next Steps', description: 'Know exactly what happens next, with transparent guidance at every stage.' },
        ] },
      }, ...(pageIndex % 2 ? [{ type: 'testimonials' as const, title: 'Loved by Clients Like You', settings: { items: [{ name: 'Verified Client', quote: `The ${name} team made the entire experience simple and genuinely valuable.`, rating: 5 }] } }] : []), {
        type: 'cta', title: isFirst ? 'Ready to Take the Next Step?' : `Continue to ${journeyNames[pageIndex + 1] || 'Get Started'}`, subtitle: 'Start today with no pressure and a clear plan.', settings: { buttonText: isFirst ? cta : 'Continue My Journey' },
      }],
    };
  });
  return {
    id: `template-${id}`, name, category, categoryLabel: CATEGORY_LABELS[category], badge: category.replaceAll('_', ' '),
    accentColor: accentColors[index % accentColors.length], thumbnailUrl: uniqueTemplateImage, description: `${pageCount}-page conversion-focused template for ${name.toLowerCase()}.`,
    suggestedSlug: id, stepsCount: pageCount, steps,
  };
}

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  ...CORE_WEBSITE_TEMPLATES,
  ...GENERATED_NICHES.map(createGeneratedTemplate),
];
