export interface TemplateBlock {
  type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'form_embed' | 'cta' | 'video';
  title: string;
  subtitle?: string;
  settings?: {
    badgeText?: string;
    buttonText?: string;
    buttonVariant?: string;
    items?: Array<{
      title?: string;
      description?: string;
      name?: string;
      role?: string;
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
  category: 'healthcare' | 'legal_finance' | 'home_services' | 'real_estate' | 'agency_b2b' | 'fitness_wellness' | 'automotive';
  categoryLabel: string;
  badge: string;
  accentColor: string;
  description: string;
  suggestedSlug: string;
  stepsCount: number;
  steps: TemplateStep[];
}

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Niches' },
  { id: 'healthcare', label: 'Healthcare & Dental' },
  { id: 'home_services', label: 'Home Services & Trades' },
  { id: 'legal_finance', label: 'Legal & Financial' },
  { id: 'real_estate', label: 'Real Estate & Properties' },
  { id: 'agency_b2b', label: 'Digital Agency & B2B' },
  { id: 'fitness_wellness', label: 'Fitness & MedSpa' },
  { id: 'automotive', label: 'Automotive & Detailing' },
] as const;

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  // 1. Healthcare / Dental
  {
    id: 'template-dental-implants',
    name: 'Premier Dental Implant & Smile Studio',
    category: 'healthcare',
    categoryLabel: 'Healthcare & Dental',
    badge: 'Dental & Orthodontics',
    accentColor: '#06b6d4',
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
                },
                {
                  name: 'Dr. Emily Watson',
                  role: 'Cosmetic Veneers & Invisalign',
                  quote: 'The level of clinical precision and artistic attention to detail is unmatched. Worth every single penny.',
                  rating: 5,
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
                },
                {
                  name: 'Sofia Reyes',
                  role: 'Morpheus8 & Filler Client',
                  quote: 'The luxury atmosphere and physician expertise make this the premier aesthetics clinic in town.',
                  rating: 5,
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
