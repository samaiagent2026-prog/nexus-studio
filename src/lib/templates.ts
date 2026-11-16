import type { Block, Collections, LocalizedText, Page, Site } from './types'
import { createBlock, createSite, ensureCollections, seedRecords } from './factory'
import { uid } from './utils'
import { COLLECTIONS } from './collections'

const L = (en: string, ar: string): LocalizedText => ({ en, ar })

export interface TemplateDef {
  id: string
  name: string
  industry: string
  tagline: LocalizedText
  description: LocalizedText
  themePreset: string
  accent: string
  gradient: string
  icon: string
  /** Collections showcased by the template — used for the gallery chips. */
  collections: string[]
  /** Every collection the template's blocks bind to, so seeds always exist. */
  boundCollections: string[]
  /** Compose pages from block types with prop overrides. */
  build: () => { pages: Page[]; header: Block; footer: Block }
}

/** Create a block of `type` with deep-merged prop overrides. */
function b(type: string, props: Record<string, any> = {}): Block {
  const block = createBlock(type)
  block.props = { ...block.props, ...props }
  return block
}

const page = (name: LocalizedText, path: string, blocks: Block[]): Page => ({
  id: uid('pg'),
  name,
  path,
  showInNav: true,
  blocks,
})

const nav = (items: [string, string, string][]) =>
  items.map(([en, ar, href]) => ({ label: L(en, ar), href }))

const collectionData = (keys: string[]): Collections =>
  Object.fromEntries(keys.filter((k) => COLLECTIONS[k]).map((k) => [k, seedRecords(k)]))

/* ============================================================
   Real estate — listings, agents, booking, map
   ============================================================ */
const realEstate: TemplateDef = {
  id: 'real-estate',
  name: 'Skyline Realty',
  industry: 'Real estate',
  tagline: L('Property marketplace & agency', 'منصة وسيط عقاري'),
  description: L('Listings, advanced search, agent profiles and viewing bookings.', 'عقارات، بحث متقدم، ملفات الوكلاء وحجز المعاينات.'),
  themePreset: 'emerald',
  accent: '#059669',
  gradient: 'from-emerald-600 via-teal-500 to-emerald-700',
  icon: 'Building2',
  collections: ['properties', 'team', 'testimonials', 'faq', 'locations', 'posts'],
  boundCollections: ['properties', 'team', 'testimonials', 'faq', 'locations', 'posts'],
  build: () => ({
    header: b('header', {
      logoText: L('Skyline', 'سكاي لاين'),
      links: nav([
        ['Home', 'الرئيسية', '/'],
        ['Listings', 'العقارات', '/listings'],
        ['Agents', 'الوكلاء', '/agents'],
        ['Guides', 'الأدلة', '/blog'],
        ['Contact', 'اتصل بنا', '/contact'],
      ]),
      ctaLabel: L('Book a viewing', 'احجز معاينة'),
      ctaHref: '/contact',
      topbarText: L('New: 240 verified listings added this week', 'جديد: 240 عقاراً موثقاً هذا الأسبوع'),
      phone: '+971 4 555 0142',
      style: 'light',
    }),
    footer: b('footer', {
      brand: L('Skyline Realty', 'سكاي لاين العقارية'),
      about: L('Licensed brokerage covering 180+ neighbourhoods with verified listings and zero buyer commission.', 'وسيط مرخص يغطي أكثر من 180 حياً بعقارات موثقة وبدون عمولة على المشتري.'),
      newsletterTitle: L('Weekly market report', 'تقرير السوق الأسبوعي'),
      copyright: L('© 2026 Skyline Realty. RERA licensed.', '© 2026 سكاي لاين العقارية. مرخصة من ريرا.'),
    }),
    pages: [
      page(L('Home', 'الرئيسية'), '/', [
        b('heroSearch', {
          heading: L('Find the address you have been looking for', 'اعثر على العنوان الذي تبحث عنه'),
          subheading: L('Filter 24,000 verified listings by budget, lifestyle and commute — then book a viewing in under a minute.', 'فلتر 24,000 عقار موثق حسب الميزانية ونمط الحياة والتنقل — ثم احجز معاينة في أقل من دقيقة.'),
          eyebrow: L('180+ neighbourhoods · 24,000 listings', 'أكثر من 180 حياً · 24,000 عقار'),
          backgroundImage: 'https://picsum.photos/seed/skyline-hero/1920/1080',
        }),
        b('listingGrid', {
          eyebrow: L('Handpicked', 'مختارة بعناية'),
          heading: L('Featured listings', 'عقارات مميزة'),
          subheading: L('Every property is verified, photographed and priced by our local experts.', 'كل عقار موثق ومصوّر ومسعّر بواسطة خبرائنا المحليين.'),
          collection: 'properties',
          limit: 6,
          variant: 'property',
          bottomCta: { label: L('Browse all listings', 'تصفح كل العقارات'), href: '/listings', variant: 'outline' },
        }),
        b('featureGrid', {
          eyebrow: L('Why Skyline', 'لماذا سكاي لاين'),
          heading: L('The brokerage built around the buyer', 'وسيط مبني حول المشتري'),
          subheading: L('Transparent pricing, verified inventory and specialists who answer in minutes.', 'أسعار شفافة ومخزون موثق ومختصون يجيبون في دقائق.'),
          items: [
            { icon: 'Shield', title: L('Verified inventory only', 'مخزون موثق فقط'), text: L('Every listing is title-checked and photographed by our team.', 'كل عقار يُفحص سند ملكيته ويُصوّر بواسطة فريقنا.') },
            { icon: 'Wallet', title: L('Zero buyer commission', 'بدون عمولة على المشتري'), text: L('We are paid by developers and sellers, never by you.', 'نتقاضى من المطورين والبائعين، لا منك أبداً.') },
            { icon: 'Clock', title: L('Same-day viewings', 'معاينات في نفس اليوم'), text: L('Book a slot and confirm within a minute, seven days a week.', 'احجز موعداً وأكّد خلال دقيقة، سبعة أيام في الأسبوع.') },
            { icon: 'TrendingUp', title: L('Market intelligence', 'ذكاء السوق'), text: L('Comparable sales and yield data on every listing page.', 'بيانات المبيعات المماثلة والعوائد في كل صفحة عقار.') },
          ],
        }),
        b('booking', {
          eyebrow: L('Book a viewing', 'احجز معاينة'),
          heading: L('Pick an agent and a time that works', 'اختر وكيلاً ووقتاً مناسباً'),
          subheading: L('Live availability from our agents — instant confirmation.', 'توفر مباشر من وكلائنا — تأكيد فوري.'),
          collection: 'team',
          variant: 'consulting',
        }),
        b('testimonials', { collection: 'testimonials', limit: 3, variant: 'grid' }),
        b('mapLocations', { collection: 'locations', limit: 3, mapQuery: 'Dubai Marina' }),
        b('ctaBand', {
          heading: L('Tell us what you are looking for', 'أخبرنا بما تبحث عنه'),
          subheading: L('Share your brief and we will shortlist five properties within 24 hours.', 'شارك متطلباتك وسنجهّز قائمة بخمسة عقارات خلال 24 ساعة.'),
          primaryCta: { label: L('Start my shortlist', 'ابدأ قائمتي'), href: '/contact', variant: 'dark', icon: 'Search' },
        }),
      ]),
      page(L('Listings', 'العقارات'), '/listings', [
        b('listingGrid', { heading: L('All listings', 'كل العقارات'), subheading: L('Refine by price, size and neighbourhood.', 'صفِّ حسب السعر والمساحة والحي.'), collection: 'properties', limit: 6, showFilters: true }),
        b('ctaBanner', { heading: L('Cannot find the right fit?', 'لم تجد ما يناسبك؟'), subheading: L('Register your requirements and get alerts before listings go public.', 'سجّل متطلباتك واحصل على تنبيهات قبل نشر العقارات.') }),
      ]),
      page(L('Agents', 'الوكلاء'), '/agents', [
        b('team', { eyebrow: L('Our people', 'فريقنا'), heading: L('Meet your local specialists', 'تعرف على مختصينا المحليين'), collection: 'team', limit: 4, columns: 4 }),
        b('stats', { variant: 'strip' }),
      ]),
      page(L('Guides', 'الأدلة'), '/blog', [
        b('blog', { heading: L('Buying guides & market notes', 'أدلة الشراء وملاحظات السوق'), collection: 'posts', limit: 3 }),
      ]),
      page(L('Contact', 'اتصل بنا'), '/contact', [
        b('contact', { heading: L('Speak to a specialist', 'تحدث مع مختص'), mapQuery: 'Dubai Marina' }),
        b('accordion', { collection: 'faq', limit: 5 }),
      ]),
    ],
  }),
}

/* ============================================================
   E-commerce — marketplace / shop
   ============================================================ */
const ecommerce: TemplateDef = {
  id: 'ecommerce',
  name: 'Lumen Store',
  industry: 'E-commerce',
  tagline: L('Modern online marketplace', 'متجر إلكتروني حديث'),
  description: L('Product catalogue, promotions, reviews and checkout-ready layout.', 'كتالوج منتجات وعروض وتقييمات وتخطيط جاهز للشراء.'),
  themePreset: 'amber',
  accent: '#d97706',
  gradient: 'from-amber-500 via-orange-500 to-rose-500',
  icon: 'ShoppingBag',
  collections: ['products', 'testimonials', 'faq', 'posts'],
  boundCollections: ['products', 'testimonials', 'faq', 'posts'],
  build: () => ({
    header: b('header', {
      logoText: L('Lumen', 'لومن'),
      links: nav([
        ['Shop', 'المتجر', '/shop'],
        ['Deals', 'العروض', '/deals'],
        ['Journal', 'المدونة', '/blog'],
        ['Support', 'الدعم', '/contact'],
      ]),
      ctaLabel: L('Track order', 'تتبع الطلب'),
      ctaHref: '/contact',
      topbarText: L('Free delivery over $75 · 30-day returns', 'توصيل مجاني فوق 75$ · إرجاع خلال 30 يوماً'),
      style: 'light',
    }),
    footer: b('footer', {
      brand: L('Lumen Store', 'متجر لومن'),
      about: L('Design-led tech and home essentials, shipped carbon-neutral from our own warehouse.', 'تقنيات ومستلزمات منزلية بقيادة التصميم، تُشحن بحياد كربوني من مستودعنا.'),
      newsletterTitle: L('Get 10% off your first order', 'احصل على خصم 10% على أول طلب'),
    }),
    pages: [
      page(L('Home', 'الرئيسية'), '/', [
        b('hero', {
          eyebrow: L('New season · 400+ new products', 'موسم جديد · أكثر من 400 منتج'),
          heading: L('Everyday objects, obsessively engineered', 'أدوات يومية بهندسة متقنة'),
          subheading: L('Audio, lighting and desk gear designed in-house — tested for a decade of use, not a season.', 'صوتيات وإضاءة وتجهيزات مكتبية مصممة داخلياً — مختبرة لعقد من الاستخدام.'),
          layout: 'split',
          mediaSide: 'right',
          image: 'https://picsum.photos/seed/lumen-hero/1200/1400',
          backgroundStyle: 'mesh',
          stats: [{ value: '400+', label: L('Products in stock', 'منتج متوفر') }, { value: '4.8', label: L('Average rating', 'متوسط التقييم') }, { value: '48h', label: L('Delivery time', 'زمن التوصيل') }],
          badges: [{ text: L('Free returns', 'إرجاع مجاني') }, { text: L('2-year warranty', 'ضمان سنتين') }, { text: L('Carbon neutral', 'حياد كربوني') }],
          floatingCard: { icon: 'Truck', title: L('Free delivery over $75', 'توصيل مجاني فوق 75$'), text: L('Dispatched same day before 4pm.', 'يُشحن في نفس اليوم قبل الساعة 4 مساءً.') },
        }),
        b('logos', { eyebrow: L('As featured in', 'ظهرنا في') }),
        b('listingGrid', {
          eyebrow: L('Best sellers', 'الأكثر مبيعاً'),
          heading: L('Loved by 40,000 customers', 'محبوب من 40,000 عميل'),
          collection: 'products',
          limit: 6,
          variant: 'product',
          showRating: true,
        }),
        b('banner', {
          eyebrow: L('Bundle & save', 'اشترِ المجموعة ووفّر'),
          heading: L('Desk setup bundle — save 25%', 'مجموعة المكتب — وفّر 25%'),
          subheading: L('Keyboard, lamp and headphones together in one box.', 'لوحة مفاتيح ومصباح وسماعات في صندوق واحد.'),
          image: 'https://picsum.photos/seed/lumen-banner/1920/900',
          height: 'md',
        }),
        b('featureGrid', {
          eyebrow: L('Shop with confidence', 'تسوّق بثقة'),
          heading: L('Everything you would expect from a premium store', 'كل ما تتوقعه من متجر متميز'),
          variant: 'bordered',
          items: [
            { icon: 'Truck', title: L('Fast, tracked delivery', 'توصيل سريع متتبع'), text: L('Same-day dispatch and live tracking on every order.', 'شحن في نفس اليوم وتتبع مباشر لكل طلب.') },
            { icon: 'RotateCw', title: L('30-day free returns', 'إرجاع مجاني 30 يوماً'), text: L('Changed your mind? Print a label and send it back.', 'غيّرت رأيك؟ اطبع الملصق وأعده.') },
            { icon: 'Shield', title: L('2-year warranty', 'ضمان سنتين'), text: L('Extendable to five years at checkout.', 'قابل للتمديد لخمس سنوات عند الشراء.') },
            { icon: 'Headphones', title: L('Human support', 'دعم بشري'), text: L('Real people on chat from 8am to midnight.', 'أشخاص حقيقيون على الدردشة من 8 صباحاً لمنتصف الليل.') },
          ],
        }),
        b('testimonials', { collection: 'testimonials', limit: 3, variant: 'grid' }),
        b('newsletter', { heading: L('Join 40,000 subscribers', 'انضم إلى 40,000 مشترك'), variant: 'gradient' }),
      ]),
      page(L('Shop', 'المتجر'), '/shop', [
        b('listingGrid', { heading: L('All products', 'كل المنتجات'), collection: 'products', limit: 6, variant: 'product', showFilters: true }),
      ]),
      page(L('Deals', 'العروض'), '/deals', [
        b('banner', { heading: L('Flash sale — up to 40% off', 'تخفيضات سريعة — حتى 40%'), image: 'https://picsum.photos/seed/lumen-deals/1920/900', height: 'sm' }),
        b('listingGrid', { heading: L('Discounted picks', 'مختارات مخفّضة'), collection: 'products', limit: 6, variant: 'product' }),
        b('table', { heading: L('Compare our top three', 'قارن أفضل ثلاثة لدينا') }),
      ]),
      page(L('Journal', 'المدونة'), '/blog', [b('blog', { collection: 'posts', limit: 3 })]),
      page(L('Support', 'الدعم'), '/contact', [b('accordion', { collection: 'faq', limit: 6, layout: 'split' }), b('contact', { heading: L('Still need a hand?', 'ما زلت تحتاج مساعدة؟') })]),
    ],
  }),
}

/* ============================================================
   Healthcare — clinic & appointments
   ============================================================ */
const healthcare: TemplateDef = {
  id: 'healthcare',
  name: 'Aurora Medical',
  industry: 'Healthcare',
  tagline: L('Clinic & appointment booking', 'عيادة وحجز مواعيد'),
  description: L('Specialist profiles, online booking, insurance and patient FAQs.', 'ملفات الأخصائيين والحجز الإلكتروني والتأمين والأسئلة الشائعة.'),
  themePreset: 'ocean',
  accent: '#0891b2',
  gradient: 'from-cyan-500 via-sky-500 to-blue-600',
  icon: 'Stethoscope',
  collections: ['doctors', 'team', 'services', 'testimonials', 'faq', 'locations'],
  boundCollections: ['doctors', 'team', 'services', 'testimonials', 'faq', 'locations'],
  build: () => ({
    header: b('header', {
      logoText: L('Aurora Medical', 'أورورا الطبية'),
      links: nav([
        ['Home', 'الرئيسية', '/'],
        ['Specialists', 'الأخصائيون', '/specialists'],
        ['Services', 'الخدمات', '/services'],
        ['Insurance', 'التأمين', '/insurance'],
        ['Contact', 'اتصل بنا', '/contact'],
      ]),
      ctaLabel: L('Book appointment', 'احجز موعداً'),
      ctaHref: '/book',
      topbarText: L('Walk-in clinic open 7 days · 24/7 emergency line', 'عيادة بدون موعد 7 أيام · خط طوارئ 24/7'),
      style: 'glass',
    }),
    footer: b('footer', {
      brand: L('Aurora Medical Group', 'مجموعة أورورا الطبية'),
      about: L('DHA-licensed multi-specialty clinics with 180 consultants and same-day appointments.', 'عيادات متعددة التخصصات مرخصة من هيئة الصحة مع 180 استشارياً ومواعيد في نفس اليوم.'),
      newsletterTitle: L('Health notes, monthly', 'ملاحظات صحية شهرية'),
      copyright: L('© 2026 Aurora Medical Group. DHA licensed.', '© 2026 مجموعة أورورا الطبية. مرخصة من هيئة الصحة.'),
    }),
    pages: [
      page(L('Home', 'الرئيسية'), '/', [
        b('hero', {
          eyebrow: L('Same-day appointments · 180 consultants', 'مواعيد في نفس اليوم · 180 استشارياً'),
          heading: L('Specialist care, booked in under a minute', 'رعاية تخصصية، احجز في أقل من دقيقة'),
          subheading: L('Choose your consultant, see live availability and confirm instantly — with insurance handled upfront.', 'اختر استشاريك، شاهد التوفر المباشر وأكّد فوراً — مع معالجة التأمين مسبقاً.'),
          layout: 'split',
          mediaSide: 'left',
          image: 'https://picsum.photos/seed/aurora-hero/1200/1400',
          backgroundStyle: 'glow',
          stats: [{ value: '180', label: L('Consultants', 'استشاري') }, { value: '4.9', label: L('Patient rating', 'تقييم المرضى') }, { value: '<15m', label: L('Average wait', 'متوسط الانتظار') }],
          badges: [{ text: L('DHA licensed', 'مرخص من هيئة الصحة') }, { text: L('24 insurance partners', '24 شريك تأمين') }, { text: L('Multilingual staff', 'فريق متعدد اللغات') }],
          floatingCard: { icon: 'CalendarCheck', title: L('Next available: today 16:00', 'أقرب موعد: اليوم 16:00'), text: L('Cardiology with Dr. Sara Al-Mansoori.', 'أمراض القلب مع د. سارة المنصوري.') },
        }),
        b('featureGrid', {
          eyebrow: L('Care services', 'خدمات الرعاية'),
          heading: L('Comprehensive specialities under one roof', 'تخصصات شاملة تحت سقف واحد'),
          subheading: L('From diagnostics to long-term management, with a single medical record.', 'من التشخيص إلى الإدارة طويلة الأمد، بسجل طبي واحد.'),
          variant: 'bordered',
          items: [
            { icon: 'HeartPulse', title: L('Cardiology', 'أمراض القلب'), text: L('ECG, echo and interventional procedures.', 'تخطيط القلب والإيكو والإجراءات التداخلية.') },
            { icon: 'Activity', title: L('Orthopaedics', 'جراحة العظام'), text: L('Sports injuries, joints and rehabilitation.', 'إصابات الرياضة والمفاصل وإعادة التأهيل.') },
            { icon: 'Microscope', title: L('Dermatology', 'الأمراض الجلدية'), text: L('Medical, laser and aesthetic dermatology.', 'الجلد الطبي والليزر والتجميل.') },
            { icon: 'Baby', title: L('Paediatrics', 'طب الأطفال'), text: L('Newborn care, vaccines and growth clinics.', 'رعاية المواليد والتطعيمات وعيادات النمو.') },
            { icon: 'Pill', title: L('Internal medicine', 'الباطنية'), text: L('Chronic disease and preventive screening.', 'الأمراض المزمنة والفحص الوقائي.') },
            { icon: 'Brain', title: L('Neurology', 'الأعصاب'), text: L('Headache, epilepsy and nerve studies.', 'الصداع والصرع ودراسات الأعصاب.') },
          ],
        }),
        b('team', {
          eyebrow: L('Our consultants', 'استشاريونا'),
          heading: L('Specialists you can trust', 'أخصائيون تثق بهم'),
          subheading: L('Board-certified, multilingual and accepting new patients.', 'معتمدون ومتعددو اللغات ويستقبلون مرضى جدد.'),
          collection: 'team',
          limit: 4,
          columns: 4,
        }),
        b('booking', {
          eyebrow: L('Online booking', 'الحجز الإلكتروني'),
          heading: L('Choose a consultant and time', 'اختر الاستشاري والوقت'),
          subheading: L('Live availability across all clinics — confirmation by SMS instantly.', 'توفر مباشر في كل العيادات — تأكيد بالرسائل فوراً.'),
          collection: 'doctors',
          variant: 'clinic',
        }),
        b('testimonials', { collection: 'testimonials', limit: 3, variant: 'grid' }),
        b('accordion', { collection: 'faq', limit: 5, layout: 'split' }),
      ]),
      page(L('Specialists', 'الأخصائيون'), '/specialists', [
        b('team', { heading: L('All specialists', 'كل الأخصائيين'), collection: 'team', limit: 4, columns: 4, variant: 'card' }),
        b('ctaBanner', { heading: L('Need a specific speciality?', 'تحتاج تخصصاً معيناً؟'), subheading: L('Our care team will match you within one business day.', 'فريق الرعاية سيرشّح لك خلال يوم عمل.') }),
      ]),
      page(L('Services', 'الخدمات'), '/services', [
        b('listingGrid', { heading: L('Treatments & packages', 'العلاجات والحزم'), collection: 'services', limit: 4, variant: 'service', columns: 2, showFilters: false }),
        b('stats', { variant: 'strip' }),
      ]),
      page(L('Insurance', 'التأمين'), '/insurance', [
        b('richText', { eyebrow: L('Coverage', 'التغطية'), heading: L('We work with 24 major insurers', 'نعمل مع 24 شركة تأمين رئيسية'), showImage: true, image: 'https://picsum.photos/seed/aurora-insurance/1000/800' }),
        b('table', { heading: L('Coverage by insurer', 'التغطية حسب الشركة') }),
      ]),
      page(L('Book', 'احجز'), '/book', [b('booking', { heading: L('Book your appointment', 'احجز موعدك'), subheading: L('Three steps: choose consultant, pick a slot, confirm.', 'ثلاث خطوات: اختر الاستشاري، اختر الموعد، أكّد.') })]),
      page(L('Contact', 'اتصل بنا'), '/contact', [b('contact', { heading: L('Reach the clinic', 'تواصل مع العيادة'), mapQuery: 'Dubai Healthcare City' }), b('mapLocations', { collection: 'locations', limit: 3 })]),
    ],
  }),
}

/* ============================================================
   Corporate / SaaS consulting
   ============================================================ */
const corporate: TemplateDef = {
  id: 'corporate',
  name: 'Meridian Partners',
  industry: 'Corporate',
  tagline: L('Consulting & professional services', 'الاستشارات والخدمات المهنية'),
  description: L('Authority-building corporate site with case studies, team and pricing.', 'موقع مؤسسي يعزز المكانة مع دراسات الحالة والفريق والأسعار.'),
  themePreset: 'indigo',
  accent: '#4f46e5',
  gradient: 'from-indigo-600 via-violet-600 to-blue-700',
  icon: 'Briefcase',
  collections: ['services', 'team', 'testimonials', 'faq', 'pricing', 'posts'],
  boundCollections: ['services', 'team', 'testimonials', 'faq', 'pricing', 'posts'],
  build: () => ({
    header: b('header', {
      logoText: L('Meridian', 'ميريديان'),
      links: nav([
        ['Home', 'الرئيسية', '/'],
        ['Services', 'الخدمات', '/services'],
        ['Work', 'الأعمال', '/work'],
        ['Pricing', 'الأسعار', '/pricing'],
        ['Insights', 'الرؤى', '/blog'],
        ['Contact', 'اتصل بنا', '/contact'],
      ]),
      ctaLabel: L('Book a strategy call', 'احجز مكالمة'),
      ctaHref: '/contact',
      topbarText: L('Now hiring: senior front-end engineers', 'نوظّف الآن: مهندسي واجهات أول'),
      style: 'light',
    }),
    footer: b('footer', {
      brand: L('Meridian Partners', 'ميريديان بارتنرز'),
      about: L('Strategy, design and engineering for organisations that need to move quickly without breaking things.', 'استراتيجية وتصميم وهندسة للمؤسسات التي تحتاج للتحرك بسرعة دون أخطاء.'),
      newsletterTitle: L('The Meridian memo', 'مذكرة ميريديان'),
    }),
    pages: [
      page(L('Home', 'الرئيسية'), '/', [
        b('hero', {
          eyebrow: L('Trusted by 12,000+ teams', 'موثوق من أكثر من 12,000 فريق'),
          heading: L('Clarity, then velocity', 'الوضوح ثم السرعة'),
          subheading: L('We help leadership teams turn ambiguous problems into shipped products — with a single accountable partner.', 'نساعد فرق القيادة على تحويل المشكلات الغامضة إلى منتجات مُطلقة — مع شريك واحد مسؤول.'),
          layout: 'split',
          mediaSide: 'right',
          backgroundStyle: 'mesh',
          image: 'https://picsum.photos/seed/meridian-hero/1200/1400',
          stats: [{ value: '3.4x', label: L('Average revenue lift', 'نمو الإيرادات') }, { value: '36h', label: L('Average launch', 'متوسط الإطلاق') }, { value: '98%', label: L('Client retention', 'احتفاظ العملاء') }],
          badges: [{ text: L('Senior-only teams', 'فرق بخبرة عالية') }, { text: L('Fixed price', 'سعر ثابت') }, { text: L('Weekly demos', 'عروض أسبوعية') }],
        }),
        b('logos', {}),
        b('steps', { heading: L('How we work', 'كيف نعمل'), variant: 'timeline' }),
        b('featureGrid', { heading: L('Capabilities', 'القدرات'), variant: 'card', columns: 3 }),
        b('stats', { variant: 'dark', heading: L('Outcomes, not activity', 'نتائج لا مجرد نشاط') }),
        b('testimonials', { collection: 'testimonials', limit: 3, variant: 'grid' }),
        b('pricing', { heading: L('Engagement models', 'نماذج التعاقد'), collection: 'pricing', limit: 3 }),
        b('accordion', { collection: 'faq', limit: 5, layout: 'split' }),
        b('ctaBand', { heading: L('Start with a free strategy call', 'ابدأ بمكالمة استراتيجية مجانية') }),
      ]),
      page(L('Services', 'الخدمات'), '/services', [
        b('listingGrid', { heading: L('What we do', 'ما نقدمه'), collection: 'services', limit: 4, variant: 'service', columns: 2, showFilters: false }),
        b('imageText', { heading: L('A senior team, not a bench', 'فريق خبير لا احتياطي'), mediaSide: 'right', image: 'https://picsum.photos/seed/meridian-services/1100/900' }),
        b('ctaBanner', { heading: L('Need a scoped estimate?', 'تحتاج تقديراً مفصلاً؟') }),
      ]),
      page(L('Work', 'الأعمال'), '/work', [
        b('gallery', { heading: L('Selected engagements', 'مشاريع مختارة'), layout: 'masonry', columns: 3 }),
        b('stats', { variant: 'cards' }),
      ]),
      page(L('Pricing', 'الأسعار'), '/pricing', [
        b('pricing', { heading: L('Transparent plans', 'خطط شفافة'), collection: 'pricing', limit: 3 }),
        b('table', { heading: L('Compare in detail', 'قارن بالتفصيل') }),
        b('accordion', { collection: 'faq', limit: 5 }),
      ]),
      page(L('Insights', 'الرؤى'), '/blog', [b('blog', { collection: 'posts', limit: 3 }), b('newsletter', {})]),
      page(L('Contact', 'اتصل بنا'), '/contact', [b('contact', { heading: L('Let us talk', 'لنتحدث'), mapQuery: 'Business Bay Dubai' })]),
    ],
  }),
}

/* ============================================================
   Restaurant / hospitality
   ============================================================ */
const restaurant: TemplateDef = {
  id: 'restaurant',
  name: 'Copper Table',
  industry: 'Food & Beverage',
  tagline: L('Restaurant & reservations', 'مطعم وحجوزات'),
  description: L('Appetising menu, reservations, gallery and location hours.', 'قائمة شهية وحجوزات ومعرض وعنوان وساعات.'),
  themePreset: 'crimson',
  accent: '#dc2626',
  gradient: 'from-rose-600 via-red-500 to-amber-500',
  icon: 'UtensilsCrossed',
  collections: ['menu', 'events', 'team', 'testimonials', 'locations', 'faq'],
  boundCollections: ['menu', 'events', 'team', 'testimonials', 'locations', 'faq'],
  build: () => ({
    header: b('header', {
      logoText: L('Copper Table', 'طاولة كوبر'),
      links: nav([
        ['Home', 'الرئيسية', '/'],
        ['Menu', 'القائمة', '/menu'],
        ['Events', 'الفعاليات', '/events'],
        ['Our story', 'قصتنا', '/about'],
        ['Contact', 'اتصل بنا', '/contact'],
      ]),
      ctaLabel: L('Reserve a table', 'احجز طاولة'),
      ctaHref: '/contact',
      topbarText: L('Kitchen open until 23:30 · Live music Thu–Sat', 'المطبخ مفتوح حتى 23:30 · موسيقى حية الخميس–السبت'),
      style: 'dark',
    }),
    footer: b('footer', {
      brand: L('Copper Table', 'طاولة كوبر'),
      about: L('Wood-fired cooking, seasonal produce and a cellar of 120 labels in the heart of the city.', 'طهي على الحطب ومنتجات موسمية وقبو يضم 120 علامة في قلب المدينة.'),
      newsletterTitle: L('Seasonal menu alerts', 'تنبيهات القائمة الموسمية'),
    }),
    pages: [
      page(L('Home', 'الرئيسية'), '/', [
        b('banner', {
          eyebrow: L('Modern wood-fired kitchen', 'مطبخ حديث على الحطب'),
          heading: L('Cooked over fire, served with intent', 'يُطهى على النار ويُقدَّم بإتقان'),
          subheading: L('Seasonal produce from local farms, a cellar of 120 labels and a room built for lingering.', 'منتجات موسمية من مزارع محلية، قبو بـ120 علامة، وقاعة صُممت للبقاء طويلاً.'),
          image: 'https://picsum.photos/seed/copper-hero/1920/1080',
          height: 'full',
          overlay: 0.55,
          primaryCta: { label: L('Reserve a table', 'احجز طاولة'), href: '/contact', variant: 'gradient', icon: 'Calendar' },
          secondaryCta: { label: L('View the menu', 'شاهد القائمة'), href: '/menu', variant: 'glass', icon: 'UtensilsCrossed' },
        }),
        b('richText', {
          eyebrow: L('Our story', 'قصتنا'),
          heading: L('A kitchen built around one flame', 'مطبخ مبني حول لهب واحد'),
          body: L('Chef Nadia Rahman trained in Lyon and Istanbul before opening Copper Table. Everything is cooked over olive wood — nothing leaves the pass without being tasted twice.', 'تدربت الشيف نادية رحمن في ليون وإسطنبول قبل افتتاح طاولة كوبر. كل شيء يُطهى على خشب الزيتون — لا يخرج طبق دون تذوقه مرتين.'),
          quote: L('Fire is honest. It shows you immediately whether you were ready.', 'النار صادقة. تُظهر لك فوراً ما إذا كنت مستعداً.'),
          quoteAuthor: L('Nadia Rahman, Head Chef', 'نادية رحمن، الشيف الرئيسي'),
          showImage: true,
          image: 'https://picsum.photos/seed/copper-story/1000/800',
        }),
        b('menu', {
          eyebrow: L('Signature dishes', 'الأطباق المميزة'),
          heading: L('From tonight’s menu', 'من قائمة الليلة'),
          collection: 'menu',
          limit: 6,
          variant: 'cards',
          columns: 3,
        }),
        b('gallery', { heading: L('Inside the dining room', 'داخل قاعة الطعام'), layout: 'masonry', columns: 3 }),
        b('events', { heading: L('What is on', 'ما الجديد'), collection: 'events', limit: 3, variant: 'cards' }),
        b('testimonials', { collection: 'testimonials', limit: 3, variant: 'spotlight' }),
        b('ctaBand', { heading: L('Reserve your table tonight', 'احجز طاولتك الليلة'), variant: 'dark', backgroundImage: 'https://picsum.photos/seed/copper-cta/1800/800' }),
      ]),
      page(L('Menu', 'القائمة'), '/menu', [
        b('menu', { heading: L('Full menu', 'القائمة الكاملة'), collection: 'menu', limit: 12, variant: 'elegant', columns: 2 }),
        b('ctaBanner', { heading: L('Allergies or dietary needs?', 'حساسية أو متطلبات غذائية؟'), subheading: L('Tell us when booking and the kitchen will adapt any dish.', 'أخبرنا عند الحجز وسيكيّف المطبخ أي طبق.') }),
      ]),
      page(L('Events', 'الفعاليات'), '/events', [b('events', { heading: L('Upcoming events', 'الفعاليات القادمة'), collection: 'events', limit: 6, variant: 'cards' })]),
      page(L('Our story', 'قصتنا'), '/about', [
        b('richText', { eyebrow: L('Since 2014', 'منذ 2014'), heading: L('Ten years of cooking over fire', 'عشر سنوات من الطهي على النار'), twoColumn: false }),
        b('team', { heading: L('The kitchen brigade', 'فريق المطبخ'), collection: 'team', limit: 4, columns: 4 }),
      ]),
      page(L('Contact', 'اتصل بنا'), '/contact', [
        b('contact', { heading: L('Book a table', 'احجز طاولة'), mapQuery: 'Jumeirah Dubai' }),
        b('mapLocations', { collection: 'locations', limit: 3, heading: L('Find us', 'موقعنا') }),
        b('accordion', { collection: 'faq', limit: 5 }),
      ]),
    ],
  }),
}

export const TEMPLATES: TemplateDef[] = [realEstate, ecommerce, healthcare, corporate, restaurant]

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id)

/** Materialise a template into a full Site document. */
export function instantiateTemplate(templateId: string, overrides: { name?: string; slug?: string; adminEmail?: string; adminPassword?: string } = {}): Site {
  const template = getTemplate(templateId) ?? TEMPLATES[0]
  const built = template.build()
  const site = createSite({
    name: overrides.name || template.name,
    industry: template.industry,
    slug: overrides.slug,
    themePreset: template.themePreset,
    header: built.header,
    footer: built.footer,
    pages: built.pages,
    collections: collectionData(template.boundCollections),
    adminEmail: overrides.adminEmail,
    adminPassword: overrides.adminPassword,
  })
  // Blocks can bind to collections outside the template's headline list
  // (e.g. a healthcare site binding a team grid), so fill any gaps.
  site.collections = ensureCollections(site)
  site.settings.seo.description = template.description
  return site
}

export function blankSite(overrides: { name?: string; industry?: string; themePreset?: string } = {}): Site {
  return createSite({
    name: overrides.name || 'Untitled site',
    industry: overrides.industry || 'General',
    themePreset: overrides.themePreset || 'indigo',
    pages: [
      page(L('Home', 'الرئيسية'), '/', [
        b('hero', { backgroundStyle: 'mesh' }),
        b('featureGrid', {}),
        b('ctaBand', {}),
      ]),
    ],
    collections: {},
  })
}
