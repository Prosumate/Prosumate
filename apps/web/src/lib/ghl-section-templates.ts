export interface GhlColumnItem {
  title?: string;
  description?: string;
  badgeText?: string;
  imageUrl?: string;
  imageAlt?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonVariant?: 'solid' | 'outline' | 'glow';
  formId?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface GhlPricingTier {
  name: string;
  price: string;
  period: string;
  description?: string;
  features: string[];
  buttonText: string;
  buttonUrl?: string;
  popular?: boolean;
}

export interface GhlFaqItem {
  question: string;
  answer: string;
}

export interface GhlSectionBlock {
  type: string;
  title: string;
  subtitle?: string;
  content?: string;
  settings: {
    columnsCount?: number;
    columns?: GhlColumnItem[];
    badgeText?: string;
    buttonText?: string;
    buttonUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
    formId?: string;
    imageUrl?: string;
    imageAlt?: string;
    imagePosition?: 'right' | 'left' | 'background';
    aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4';
    borderRadius?: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full';
    items?: Array<{
      title?: string;
      description?: string;
      name?: string;
      role?: string;
      avatarUrl?: string;
      imageUrl?: string;
      quote?: string;
      rating?: number;
      [key: string]: unknown;
    }>;
    pricingTiers?: GhlPricingTier[];
    faqItems?: GhlFaqItem[];
    background?: 'dark' | 'card' | 'elevated' | 'gradient_blue' | 'gradient_purple' | 'gradient_emerald';
    maxWidth?: 'full' | 'wide' | 'boxed' | 'narrow';
    padding?: 'compact' | 'normal' | 'spacious';
    [key: string]: unknown;
  };
}

export interface GhlSectionTemplate {
  id: string;
  category: 'layout' | 'hero' | 'features' | 'forms' | 'social_proof' | 'pricing' | 'faq' | 'cta' | 'video';
  categoryLabel: string;
  name: string;
  description: string;
  iconName: string;
  block: GhlSectionBlock;
}

export const GHL_SECTION_CATEGORIES = [
  { id: 'all', label: 'All Sections & Templates' },
  { id: 'layout', label: 'Containers & Columns' },
  { id: 'hero', label: 'Hero Sections' },
  { id: 'features', label: 'Features & Services' },
  { id: 'forms', label: 'Forms & Lead Capture' },
  { id: 'social_proof', label: 'Social Proof & Reviews' },
  { id: 'pricing', label: 'Pricing Tables' },
  { id: 'faq', label: 'FAQs & Accordions' },
  { id: 'cta', label: 'Call to Action' },
  { id: 'video', label: 'Video & Media' },
] as const;

export const GHL_SECTION_TEMPLATES: GhlSectionTemplate[] = [
  // ==========================================
  // Image-Rich Section Templates (Rocket.new style)
  // ==========================================
  {
    id: 'ghl-hero-split-image',
    category: 'hero',
    categoryLabel: 'Hero Sections',
    name: 'Hero with High-Resolution Image (Split 50/50)',
    description: 'Two-column conversion hero with compelling copy on the Left and a high-impact photo or device mockup on the Right.',
    iconName: 'Layout',
    block: {
      type: 'hero',
      title: 'Accelerate Your Operations With World-Class Expertise',
      subtitle: 'Partner with industry leaders dedicated to scaling your client acquisition, automating workflows, and driving measurable ROI.',
      settings: {
        badgeText: 'Top-Rated Industry Solution',
        buttonText: 'Schedule Discovery Call',
        buttonUrl: '#lead-form',
        secondaryButtonText: 'Explore Capabilities',
        secondaryButtonUrl: '#services',
        imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
        imagePosition: 'right',
        aspectRatio: '16:9',
        borderRadius: 'rounded-2xl',
        background: 'dark',
        padding: 'spacious',
      },
    },
  },
  {
    id: 'ghl-hero-full-bg',
    category: 'hero',
    categoryLabel: 'Hero Sections',
    name: 'Hero Full-Bleed Image Background',
    description: 'Atmospheric full-width background photo with dark glassmorphic overlay, centered headline, and dual CTA buttons.',
    iconName: 'Layout',
    block: {
      type: 'hero',
      title: 'The Modern Standard in High-Performance Systems',
      subtitle: 'Engineered for seamless client retention, instant booking conversion, and multi-channel pipeline growth.',
      settings: {
        badgeText: 'Proven Enterprise Architecture',
        buttonText: 'Claim Your Strategy Session',
        buttonUrl: '#lead-form',
        secondaryButtonText: 'View Case Studies',
        secondaryButtonUrl: '#',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        imagePosition: 'background',
        aspectRatio: '16:9',
        borderRadius: 'rounded-3xl',
        background: 'dark',
        padding: 'spacious',
      },
    },
  },
  {
    id: 'ghl-features-photos',
    category: 'features',
    categoryLabel: 'Features & Services',
    name: '3-Column Cards with Photo Headers',
    description: 'Three equal feature cards with crisp high-resolution photo banners atop each service card.',
    iconName: 'Sparkles',
    block: {
      type: 'features',
      title: 'Our Core Service Specializations',
      subtitle: 'Explore our dedicated service pillars built to deliver exceptional quality and velocity.',
      settings: {
        background: 'dark',
        padding: 'spacious',
        items: [
          {
            title: '1. Strategic Architecture',
            description: 'Custom diagnostic review mapping out bottlenecks, revenue leaks, and conversion opportunities.',
            imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
          },
          {
            title: '2. Precision Implementation',
            description: 'Turnkey execution of landing pages, CRM pipelines, calendar booking, and automated nurture sequences.',
            imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
          },
          {
            title: '3. Continuous Growth & Optimization',
            description: 'Ongoing performance analytics, A/B conversion testing, and dedicated account management.',
            imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
          },
        ],
      },
    },
  },

  // ==========================================
  // 1. Containers & Layouts
  // ==========================================
  {
    id: 'ghl-layout-1-col',
    category: 'layout',
    categoryLabel: 'Containers & Columns',
    name: '1-Column Full Width Container',
    description: 'Clean single-column centered layout container for headlines, announcements, or custom elements.',
    iconName: 'Layout',
    block: {
      type: 'container',
      title: 'Centered Full Container',
      subtitle: 'Add your text, buttons, or custom elements inside this full-width container.',
      settings: {
        columnsCount: 1,
        maxWidth: 'boxed',
        padding: 'normal',
        background: 'dark',
        columns: [
          {
            title: 'Primary Container Column',
            description: 'This is a single-column responsive container ready for high-converting copy and media.',
            buttonText: 'Learn More',
            buttonUrl: '#',
          },
        ],
      },
    },
  },
  {
    id: 'ghl-layout-2-col',
    category: 'layout',
    categoryLabel: 'Containers & Columns',
    name: '2-Column Split Grid (50 / 50)',
    description: 'Side-by-side split container ideal for Value Pitch on Left + Lead Form / Card on Right.',
    iconName: 'Columns',
    block: {
      type: 'columns',
      title: 'Two-Column Split Section',
      subtitle: 'Side-by-side layout engineered for maximum contrast and visitor conversion.',
      settings: {
        columnsCount: 2,
        maxWidth: 'wide',
        padding: 'normal',
        background: 'card',
        columns: [
          {
            title: 'Why Industry Leaders Choose Our System',
            description: 'Eliminate manual bottlenecks with fully automated sales funnels, CRM sync, and SMS follow-ups.',
            badgeText: 'Proven Results',
            buttonText: 'View Case Studies',
            buttonUrl: '#',
          },
          {
            title: 'Instant Registration & Booking',
            description: 'Reserve your exclusive 1-on-1 strategy call with our senior account director.',
            badgeText: 'Limited Availability',
            buttonText: 'Claim Your Spot',
            buttonUrl: '#lead-form',
          },
        ],
      },
    },
  },
  {
    id: 'ghl-layout-3-col',
    category: 'layout',
    categoryLabel: 'Containers & Columns',
    name: '3-Column Services Grid (33 / 33 / 33)',
    description: 'Three equal columns perfect for service offerings, benefits showcase, or feature pillars.',
    iconName: 'Grid',
    block: {
      type: 'columns',
      title: 'Our Core Service Capabilities',
      subtitle: 'Comprehensive end-to-end solutions tailored for high-growth service businesses.',
      settings: {
        columnsCount: 3,
        maxWidth: 'wide',
        padding: 'normal',
        background: 'dark',
        columns: [
          {
            title: '1. Diagnostic Assessment',
            description: 'Comprehensive audit identifying revenue leaks, conversion bottlenecks, and pipeline gaps.',
            badgeText: 'Phase 1',
            buttonText: 'Learn More',
            buttonUrl: '#',
          },
          {
            title: '2. Architecture & Setup',
            description: 'Bespoke implementation of automated funnels, lead routing, and instant booking calendars.',
            badgeText: 'Phase 2',
            buttonText: 'Learn More',
            buttonUrl: '#',
          },
          {
            title: '3. Scale & Optimization',
            description: 'Real-time reporting, automated follow-up sequences, and continuous conversion lift.',
            badgeText: 'Phase 3',
            buttonText: 'Learn More',
            buttonUrl: '#',
          },
        ],
      },
    },
  },
  {
    id: 'ghl-layout-4-col',
    category: 'layout',
    categoryLabel: 'Containers & Columns',
    name: '4-Column Metrics & KPI Row (25 / 25 / 25 / 25)',
    description: 'Four compact columns designed for trust metrics, numbers, statistics, and client proof.',
    iconName: 'Layers',
    block: {
      type: 'columns',
      title: 'Proven by the Numbers',
      subtitle: 'Demonstrated track record of delivering measurable ROI for client partners.',
      settings: {
        columnsCount: 4,
        maxWidth: 'wide',
        padding: 'compact',
        background: 'elevated',
        columns: [
          {
            badgeText: '10,000+',
            title: 'Appointments Booked',
            description: 'Directly generated through automated inbound funnels.',
          },
          {
            badgeText: '99.4%',
            title: 'Client Satisfaction',
            description: 'Verified positive reviews across Google & Trustpilot.',
          },
          {
            badgeText: '< 60 Sec',
            title: 'Lead Response Time',
            description: 'Instant multi-channel SMS and email qualification.',
          },
          {
            badgeText: '$45M+',
            title: 'Pipeline Generated',
            description: 'Closed revenue tracked via integrated CRM analytics.',
          },
        ],
      },
    },
  },

  // ==========================================
  // 2. Hero Sections
  // ==========================================
  {
    id: 'ghl-hero-split',
    category: 'hero',
    categoryLabel: 'Hero Sections',
    name: 'Split Hero with Lead Form',
    description: 'Classic high-converting GHL hero with headline & bullets on the left and form on the right.',
    iconName: 'Layout',
    block: {
      type: 'hero',
      title: 'Accelerate Your Inbound Revenue with High-Converting Funnels',
      subtitle: 'Turn cold traffic into qualified consultations on autopilot. Complete the form to receive your custom growth blueprint.',
      settings: {
        badgeText: 'Official 2026 Strategy Program',
        buttonText: 'Claim Your Strategy Call',
        buttonUrl: '#lead-form',
        secondaryButtonText: 'Watch 2-Min Demo',
        secondaryButtonUrl: '#video',
        background: 'gradient_blue',
      },
    },
  },
  {
    id: 'ghl-hero-centered-vsl',
    category: 'hero',
    categoryLabel: 'Hero Sections',
    name: 'Centered Authority VSL Hero',
    description: 'Clean centered typography with badge, large headline, supporting copy, and prominent CTA.',
    iconName: 'Sparkles',
    block: {
      type: 'hero',
      title: 'The Modern Revenue Operating System Built for Service Leaders',
      subtitle: 'Unify your landing pages, CRM contacts, AI conversational nurture, and calendar appointments into one seamless dashboard.',
      settings: {
        badgeText: 'All-In-One Platform',
        buttonText: 'Start Free 14-Day Trial',
        buttonUrl: '#lead-form',
        background: 'dark',
      },
    },
  },

  // ==========================================
  // 3. Features & Services
  // ==========================================
  {
    id: 'ghl-features-3-card',
    category: 'features',
    categoryLabel: 'Features & Services',
    name: '3-Card Interactive Services Grid',
    description: 'Modern feature cards highlighting key capabilities with icons and clear descriptions.',
    iconName: 'Sparkles',
    block: {
      type: 'features',
      title: 'Engineered for Performance & Velocity',
      subtitle: 'Everything your business needs to attract, capture, and convert high-ticket clients.',
      settings: {
        items: [
          {
            title: 'High-Converting Funnel Architecture',
            description: 'Pre-optimized for lightning fast mobile load speeds, friction-free forms, and high conversion rates.',
          },
          {
            title: 'Intelligent Lead Distribution',
            description: 'Instantly sync opt-ins into your CRM with automatic tag assignment, pipelines, and notification alerts.',
          },
          {
            title: 'Omnichannel Automated Follow-Up',
            description: 'Trigger SMS, email, and call sequences within seconds of visitor submission to maximize show-up rates.',
          },
        ],
      },
    },
  },

  // ==========================================
  // 4. Forms & Lead Capture
  // ==========================================
  {
    id: 'ghl-form-card',
    category: 'forms',
    categoryLabel: 'Forms & Lead Capture',
    name: 'High-Converting Lead Form Embed Card',
    description: 'Dedicated embedded form section with security guarantees, trust seals, and instant CRM sync.',
    iconName: 'FileText',
    block: {
      type: 'form_embed',
      title: 'Request Your Confidential Consultation',
      subtitle: 'Please provide your contact details below so our advisory team can prepare your personalized audit.',
      settings: {
        badgeText: 'Confidential & Secure',
        formId: '',
      },
    },
  },

  // ==========================================
  // 5. Social Proof & Reviews
  // ==========================================
  {
    id: 'ghl-reviews-3-col',
    category: 'social_proof',
    categoryLabel: 'Social Proof & Reviews',
    name: '3-Column Verified 5-Star Reviews',
    description: 'Showcase authentic client testimonials with 5-star ratings, quotes, and client credentials.',
    iconName: 'Star',
    block: {
      type: 'testimonials',
      title: 'Trusted by Over 500+ Growing Businesses',
      subtitle: 'Read how our clients transformed their lead flow and customer acquisition.',
      settings: {
        items: [
          {
            name: 'Dr. Michael Chen',
            role: 'Founder, Apex Dental Studio',
            quote: 'Within 30 days of deploying our new consultation funnel, our monthly implant inquiries grew by 320%.',
            rating: 5,
          },
          {
            name: 'Sarah Jenkins',
            role: 'Managing Partner, Jenkins Law Group',
            quote: 'The instant SMS qualification feature ensures our attorneys only spend time speaking with qualified cases.',
            rating: 5,
          },
          {
            name: 'David Miller',
            role: 'Owner, Titan Roofing & Exterior',
            quote: 'Our cost per booked estimate dropped by over 40% while our closing rate increased substantially.',
            rating: 5,
          },
        ],
      },
    },
  },

  // ==========================================
  // 6. Pricing Tables
  // ==========================================
  {
    id: 'ghl-pricing-3-tier',
    category: 'pricing',
    categoryLabel: 'Pricing Tables',
    name: '3-Tier SaaS / Agency Pricing Matrix',
    description: 'Feature-rich pricing table with Starter, Professional (highlighted popular), and Enterprise tiers.',
    iconName: 'CreditCard',
    block: {
      type: 'pricing',
      title: 'Transparent, Value-Driven Investment Plans',
      subtitle: 'Select the tier that aligns with your monthly lead generation and client volume goals.',
      settings: {
        pricingTiers: [
          {
            name: 'Essential Growth',
            price: '$497',
            period: '/month',
            description: 'Ideal for solo practitioners and emerging local service businesses.',
            features: [
              '1 Live Sales Funnel & Landing Page',
              'Up to 1,000 CRM Contacts',
              'Automated Email & SMS Follow-ups',
              'Integrated Appointment Calendar',
              'Standard Email Support',
            ],
            buttonText: 'Get Started',
            buttonUrl: '#lead-form',
            popular: false,
          },
          {
            name: 'Professional Scale',
            price: '$997',
            period: '/month',
            description: 'Our most popular plan for established practices scaling revenue.',
            features: [
              'Unlimited Multi-Step Conversion Funnels',
              'Up to 10,000 CRM Contacts',
              'AI Conversational Lead Qualification',
              'Custom Domain & SSL Hosting',
              'Multi-Channel Unified Inbox',
              'Priority 24/7 VIP Support',
            ],
            buttonText: 'Start 14-Day Free Trial',
            buttonUrl: '#lead-form',
            popular: true,
          },
          {
            name: 'Enterprise Authority',
            price: '$1,997',
            period: '/month',
            description: 'For high-volume organizations requiring dedicated account management.',
            features: [
              'Everything in Professional Scale',
              'Unlimited CRM Contacts & Pipelines',
              'Dedicated Success Manager & Custom Integrations',
              'Advanced Multi-Touch Attribution Reporting',
              'Custom API Webhooks & Workflow Triggers',
              '1-on-1 Monthly Strategy Consultation',
            ],
            buttonText: 'Contact Enterprise Sales',
            buttonUrl: '#lead-form',
            popular: false,
          },
        ],
      },
    },
  },

  // ==========================================
  // 7. FAQs & Accordions
  // ==========================================
  {
    id: 'ghl-faq-accordion',
    category: 'faq',
    categoryLabel: 'FAQs & Accordions',
    name: 'Collapsible 4-Item Service FAQ Accordion',
    description: 'Overcome visitor hesitations and answer frequent objections with interactive collapsible cards.',
    iconName: 'HelpCircle',
    block: {
      type: 'faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Clear answers to common questions about our process, onboarding, and results.',
      settings: {
        faqItems: [
          {
            question: 'How quickly can our website or funnel go live?',
            answer: 'Most client funnels are fully configured, branded, and accepting live traffic within 48 to 72 hours of receiving your initial onboarding details.',
          },
          {
            question: 'Do leads automatically sync with our existing CRM?',
            answer: 'Yes. Every submission captures contact data, fires automated confirmation sequences, and can sync via native webhooks to your existing tools.',
          },
          {
            question: 'Is mobile responsiveness guaranteed across all devices?',
            answer: 'Every layout container and section is engineered mobile-first, ensuring fast loading and pixel-perfect rendering on iOS, Android, tablets, and desktops.',
          },
          {
            question: 'Can we edit copy, buttons, and sections after publishing?',
            answer: 'Yes! Our visual drag-and-drop page editor allows you to modify headlines, buttons, pricing, and blocks in real-time with instant live updates.',
          },
        ],
      },
    },
  },

  // ==========================================
  // 8. Call to Action (CTA)
  // ==========================================
  {
    id: 'ghl-cta-urgency',
    category: 'cta',
    categoryLabel: 'Call to Action',
    name: 'High-Urgency Conversion Banner (Dual CTAs)',
    description: 'High-contrast gradient banner with urgency badge, persuasive headline, and dual action buttons.',
    iconName: 'ArrowRight',
    block: {
      type: 'cta',
      title: 'Ready to Transform Your Customer Acquisition Pipeline?',
      subtitle: 'Join hundreds of industry-leading service businesses scaling their revenue with automated funnels.',
      settings: {
        badgeText: 'Limited Openings This Month',
        buttonText: 'Claim Your Strategy Call Now',
        buttonUrl: '#lead-form',
        secondaryButtonText: 'Speak to a Specialist',
        secondaryButtonUrl: '#contact',
        background: 'gradient_purple',
      },
    },
  },

  // ==========================================
  // 9. Video & Media
  // ==========================================
  {
    id: 'ghl-video-showcase',
    category: 'video',
    categoryLabel: 'Video & Media',
    name: 'Video Showcase with Trust Badges',
    description: 'Responsive 16:9 video frame with video player wrapper, headline, and satisfaction seal.',
    iconName: 'Video',
    block: {
      type: 'video',
      title: 'See How Our Conversion System Works (Watch 3-Min Walkthrough)',
      subtitle: 'A brief breakdown of how we automate your pipeline from initial visitor click to closed client consultation.',
      settings: {
        badgeText: 'Executive Walkthrough',
        buttonText: 'Book Free Assessment After Watching',
        buttonUrl: '#lead-form',
        background: 'dark',
      },
    },
  },
];
