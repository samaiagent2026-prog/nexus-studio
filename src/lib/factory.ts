import type { Block, BlockStyle, CollectionRecord, Collections, Lang, LocalizedText, MediaAsset, Page, Site, SiteSettings } from './types'
import { clone, slugify, uid } from './utils'
import { defaultTheme } from './theme'
import { getBlockDef } from '../components/blocks/registry'
import { COLLECTIONS } from './collections'

export const defaultBlockStyle = (overrides: Partial<BlockStyle> = {}): BlockStyle => ({
  paddingY: 64,
  contentWidth: 1200,
  align: 'left',
  gap: 24,
  animation: 'none',
  ...overrides,
})

export function createBlock(type: string, overrides: Partial<Block> = {}): Block {
  const def = getBlockDef(type)
  const props = def ? def.defaults() : {}
  return {
    id: uid('blk'),
    type,
    props,
    style: defaultBlockStyle(def?.category === 'layout' ? { paddingY: 16 } : {}),
    elements: {},
    hidden: false,
    locked: false,
    label: def?.label,
    ...overrides,
  }
}

export const defaultPage = (name: LocalizedText, path = '/', blocks: Block[] = []): Page => ({
  id: uid('pg'),
  name,
  path,
  showInNav: true,
  blocks,
})

export const defaultSettings = (siteName: string, industry: string): SiteSettings => ({
  languages: ['en', 'ar'],
  defaultLang: 'en',
  seo: {
    title: { en: siteName, ar: siteName },
    description: {
      en: `${siteName} — ${industry} experiences built with Nexus Studio.`,
      ar: `${siteName} — تجارب ${industry} مبنية بواسطة نيكسوس استوديو.`,
    },
    keywords: industry,
  },
  announcementOn: false,
  announcement: { en: '', ar: '' },
  published: true,
})

export interface CreateSiteInput {
  name: string
  industry: string
  slug?: string
  themePreset?: string
  header?: Block
  footer?: Block
  pages?: Page[]
  collections?: Collections
  logo?: string
  adminEmail?: string
  adminPassword?: string
}

/** Deterministic media seed so a fresh site always shows imagery. */
function seedMedia(siteId: string, pages: Page[]): MediaAsset[] {
  const urls = new Set<string>()
  const walk = (v: any) => {
    if (typeof v === 'string') {
      if (/^https?:\/\//.test(v) && /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(v)) urls.add(v)
      return
    }
    if (Array.isArray(v)) return v.forEach(walk)
    if (v && typeof v === 'object') return Object.values(v).forEach(walk)
  }
  pages.forEach((p) => p.blocks.forEach((b) => walk(b.props)))
  return Array.from(urls)
    .slice(0, 24)
    .map((url, i) => ({
      id: uid('media'),
      name: decodeURIComponent(url.split('/seed/')[1]?.split('/')[0] ?? `asset-${i + 1}.jpg`),
      url,
      kind: 'image' as const,
      createdAt: Date.now() - i * 3600_000,
    }))
}

export function createSite(input: CreateSiteInput): Site {
  const id = uid('site')
  const slug = slugify(input.slug || input.name)
  const pages = input.pages ?? [defaultPage({ en: 'Home', ar: 'الرئيسية' }, '/')]
  const site: Site = {
    id,
    name: input.name,
    slug,
    industry: input.industry,
    logo: input.logo,
    theme: defaultTheme(input.themePreset ?? 'indigo'),
    settings: defaultSettings(input.name, input.industry),
    pages,
    collections: input.collections ?? {},
    media: seedMedia(id, pages),
    header: input.header ?? createBlock('header'),
    footer: input.footer ?? createBlock('footer'),
    admin: {
      email: input.adminEmail ?? 'admin@nexus.studio',
      password: input.adminPassword ?? 'admin123',
      name: 'Site Administrator',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return site
}

/** Add any collections referenced by blocks but missing from the site. */
export function ensureCollections(site: Site): Collections {
  const next: Collections = { ...site.collections }
  const referenced = new Set<string>()
  const scan = (blocks: Block[]) =>
    blocks.forEach((b) => {
      const key = b.props?.collection
      if (typeof key === 'string' && key && COLLECTIONS[key]) referenced.add(key)
    })
  site.pages.forEach((p) => scan(p.blocks))
  scan([site.header, site.footer])
  referenced.forEach((key) => {
    if (!next[key]) next[key] = seedRecords(key)
  })
  return next
}

/** Demo records so a new site never renders an empty collection. */
export function seedRecords(key: string): CollectionRecord[] {
  const seeds: Record<string, CollectionRecord[]> = {
    properties: [
      { title: { en: 'Marina Skyline Apartment', ar: 'شقة مارينا سكاي لاين' }, type: { en: 'Apartment', ar: 'شقة' }, status: { en: 'For sale', ar: 'للبيع' }, price: { amount: 1450000, currency: 'AED' }, beds: 3, baths: 2, area: 1650, city: { en: 'Dubai Marina', ar: 'دبي مارينا' }, address: { en: 'Marina Boulevard, Tower 4', ar: 'شارع المارينا، برج 4' }, image: 'https://picsum.photos/seed/prop-1/1200/900', featured: true, description: { en: 'Panoramic sea views with a private balcony and upgraded kitchen.', ar: 'إطلالات بحرية بانورامية مع شرفة خاصة ومطبخ مطوّر.' } },
      { title: { en: 'Palm Garden Villa', ar: 'فيلا حديقة النخيل' }, type: { en: 'Villa', ar: 'فيلا' }, status: { en: 'For sale', ar: 'للبيع' }, price: { amount: 4200000, currency: 'AED' }, beds: 5, baths: 6, area: 6200, city: { en: 'Palm Jumeirah', ar: 'نخلة جميرا' }, address: { en: 'Frond K, Palm Jumeirah', ar: 'فرع K، نخلة جميرا' }, image: 'https://picsum.photos/seed/prop-2/1200/900', featured: true, description: { en: 'Beachfront villa with landscaped gardens and a 20m pool.', ar: 'فيلا على الشاطئ مع حدائق منسقة ومسبح 20 متر.' } },
      { title: { en: 'Downtown Loft 2BR', ar: 'لوفت وسط المدينة بغرفتين' }, type: { en: 'Apartment', ar: 'شقة' }, status: { en: 'For rent', ar: 'للإيجار' }, price: { amount: 145000, currency: 'AED', suffix: { en: '/ year', ar: '/ سنة' } }, beds: 2, baths: 2, area: 1180, city: { en: 'Downtown', ar: 'وسط المدينة' }, address: { en: 'Burj Views, Tower 2', ar: 'برج فيوز، برج 2' }, image: 'https://picsum.photos/seed/prop-3/1200/900', featured: false, description: { en: 'Double-height loft steps from the Opera district.', ar: 'لوفت بارتفاع مزدوج على خطوات من حي الأوبرا.' } },
      { title: { en: 'Harbor View Townhouse', ar: 'تاون هاوس بإطلالة المرفأ' }, type: { en: 'Townhouse', ar: 'تاون هاوس' }, status: { en: 'New', ar: 'جديد' }, price: { amount: 2350000, currency: 'AED' }, beds: 4, baths: 4, area: 3100, city: { en: 'Dubai Creek Harbour', ar: 'خور دبي' }, address: { en: 'Creek Harbour, District 3', ar: 'خور دبي، المنطقة 3' }, image: 'https://picsum.photos/seed/prop-4/1200/900', featured: true, description: { en: 'Brand-new townhouse with roof terrace and skyline views.', ar: 'تاون هاوس جديد مع تراس علوي وإطلالات على الأفق.' } },
      { title: { en: 'Smart Office Suite', ar: 'مكتب ذكي' }, type: { en: 'Office', ar: 'مكتب' }, status: { en: 'For rent', ar: 'للإيجار' }, price: { amount: 320000, currency: 'AED', suffix: { en: '/ year', ar: '/ سنة' } }, beds: 0, baths: 2, area: 2400, city: { en: 'Business Bay', ar: 'الخليج التجاري' }, address: { en: 'Bay Square, Building 7', ar: 'باي سكوير، مبنى 7' }, image: 'https://picsum.photos/seed/prop-5/1200/900', featured: false, description: { en: 'Fitted suite with meeting rooms and smart access control.', ar: 'مكتب مجهز مع قاعات اجتماعات وتحكم ذكي بالدخول.' } },
      { title: { en: 'Golf Course Penthouse', ar: 'بنتهاوس بإطلالة الجولف' }, type: { en: 'Penthouse', ar: 'بنتهاوس' }, status: { en: 'For sale', ar: 'للبيع' }, price: { amount: 6800000, currency: 'AED' }, beds: 4, baths: 5, area: 4300, city: { en: 'Emirates Hills', ar: 'تلال الإمارات' }, address: { en: 'Emirates Hills, Sector E', ar: 'تلال الإمارات، قطاع E' }, image: 'https://picsum.photos/seed/prop-6/1200/900', featured: true, description: { en: 'Duplex penthouse with private lift and 180° golf views.', ar: 'بنتهاوس دوبلكس مع مصعد خاص وإطلالات 180° على الجولف.' } },
    ],
    products: [
      { title: { en: 'Aurora Wireless Headphones', ar: 'سماعات أورورا اللاسلكية' }, category: { en: 'Audio', ar: 'الصوتيات' }, brand: 'Aurora', price: { amount: 349, currency: 'USD' }, compareAt: { amount: 429, currency: 'USD' }, rating: 4.8, reviews: 1284, badge: { en: 'Best seller', ar: 'الأكثر مبيعاً' }, image: 'https://picsum.photos/seed/prod-1/900/900', stock: true, description: { en: 'Hybrid noise cancelling with 40-hour battery life.', ar: 'إلغاء ضوضاء هجين مع عمر بطارية 40 ساعة.' } },
      { title: { en: 'Lumen Smart Desk Lamp', ar: 'مصباح لومن الذكي' }, category: { en: 'Lighting', ar: 'الإضاءة' }, brand: 'Lumen', price: { amount: 129, currency: 'USD' }, rating: 4.6, reviews: 412, badge: { en: 'New', ar: 'جديد' }, image: 'https://picsum.photos/seed/prod-2/900/900', stock: true, description: { en: 'Tunable white light with wireless charging base.', ar: 'ضوضاء بيضاء قابلة للتعديل مع قاعدة شحن لاسلكي.' } },
      { title: { en: 'Vertex Mechanical Keyboard', ar: 'لوحة مفاتيح فيرتكس' }, category: { en: 'Desk', ar: 'المكتب' }, brand: 'Vertex', price: { amount: 189, currency: 'USD' }, rating: 4.9, reviews: 967, image: 'https://picsum.photos/seed/prod-3/900/900', stock: true, description: { en: 'Hot-swappable switches with aluminium frame.', ar: 'مفاتيح قابلة للتبديل مع هيكل من الألومنيوم.' } },
      { title: { en: 'Harbor Travel Backpack', ar: 'حقيبة هاربر للسفر' }, category: { en: 'Bags', ar: 'الحقائب' }, brand: 'Harbor', price: { amount: 219, currency: 'USD' }, compareAt: { amount: 279, currency: 'USD' }, rating: 4.7, reviews: 733, badge: { en: '-22%', ar: '-22%' }, image: 'https://picsum.photos/seed/prod-4/900/900', stock: true, description: { en: 'Water-resistant 35L pack with laptop sleeve.', ar: 'حقيبة 35 لتراً مقاومة للماء مع جيب للحاسوب.' } },
      { title: { en: 'Meridian Smart Watch', ar: 'ساعة ميريديان الذكية' }, category: { en: 'Wearables', ar: 'الأجهزة القابلة للارتداء' }, brand: 'Meridian', price: { amount: 499, currency: 'USD' }, rating: 4.5, reviews: 2081, image: 'https://picsum.photos/seed/prod-5/900/900', stock: false, description: { en: 'ECG, SpO₂ and 10-day battery in titanium.', ar: 'تخطيط قلب وقياس الأكسجين وبطارية 10 أيام من التيتانيوم.' } },
      { title: { en: 'Forge Espresso Machine', ar: 'ماكينة إسبريسو فورج' }, category: { en: 'Kitchen', ar: 'المطبخ' }, brand: 'Forge', price: { amount: 899, currency: 'USD' }, rating: 4.8, reviews: 356, image: 'https://picsum.photos/seed/prod-6/900/900', stock: true, description: { en: 'Dual boiler with PID temperature control.', ar: 'غلاية مزدوجة مع تحكم بدرجة الحرارة PID.' } },
    ],
    doctors: [
      { name: { en: 'Dr. Sara Al-Mansoori', ar: 'د. سارة المنصوري' }, speciality: { en: 'Cardiology', ar: 'أمراض القلب' }, title: { en: 'Consultant Cardiologist', ar: 'استشاري قلب' }, clinic: { en: 'Aurora Heart Centre', ar: 'مركز أورورا للقلب' }, experience: 14, rating: 4.9, fee: { amount: 450, currency: 'AED' }, languages: [{ en: 'Arabic', ar: 'العربية' }, { en: 'English', ar: 'الإنجليزية' }], photo: 'https://picsum.photos/seed/doc-1/600/600', available: true, bio: { en: 'Interventional cardiology with a focus on preventive care.', ar: 'طب القلب التداخلي مع التركيز على الرعاية الوقائية.' } },
      { name: { en: 'Dr. Omar Haddad', ar: 'د. عمر حداد' }, speciality: { en: 'Orthopaedics', ar: 'جراحة العظام' }, title: { en: 'Sports Medicine Specialist', ar: 'أخصائي طب الرياضة' }, clinic: { en: 'Motion Clinic', ar: 'عيادة موشن' }, experience: 11, rating: 4.8, fee: { amount: 400, currency: 'AED' }, languages: [{ en: 'Arabic', ar: 'العربية' }, { en: 'French', ar: 'الفرنسية' }], photo: 'https://picsum.photos/seed/doc-2/600/600', available: true, bio: { en: 'Team physician for two national squads.', ar: 'طبيب فريق لمنتخبين وطنيين.' } },
      { name: { en: 'Dr. Emily Chen', ar: 'د. إميلي تشن' }, speciality: { en: 'Dermatology', ar: 'الأمراض الجلدية' }, title: { en: 'Consultant Dermatologist', ar: 'استشارية جلدية' }, clinic: { en: 'Lumen Skin Institute', ar: 'معهد لومن للجلد' }, experience: 9, rating: 4.9, fee: { amount: 380, currency: 'AED' }, languages: [{ en: 'English', ar: 'الإنجليزية' }, { en: 'Mandarin', ar: 'الصينية' }], photo: 'https://picsum.photos/seed/doc-3/600/600', available: true, bio: { en: 'Laser and aesthetic dermatology specialist.', ar: 'أخصائية الجلد بالليزر والتجميل.' } },
      { name: { en: 'Dr. Yusuf Karim', ar: 'د. يوسف كريم' }, speciality: { en: 'Paediatrics', ar: 'طب الأطفال' }, title: { en: 'Consultant Paediatrician', ar: 'استشاري أطفال' }, clinic: { en: 'Sunrise Children’s Clinic', ar: 'عيادة صن رايز للأطفال' }, experience: 16, rating: 5, fee: { amount: 350, currency: 'AED' }, languages: [{ en: 'Arabic', ar: 'العربية' }, { en: 'English', ar: 'الإنجليزية' }, { en: 'Urdu', ar: 'الأردية' }], photo: 'https://picsum.photos/seed/doc-4/600/600', available: false, bio: { en: 'Newborn care, allergies and childhood asthma.', ar: 'رعاية حديثي الولادة والحساسية والربو لدى الأطفال.' } },
    ],
    team: [
      { name: { en: 'Layla Haddad', ar: 'ليلى حداد' }, role: { en: 'Managing Partner', ar: 'الشريك الإداري' }, bio: { en: 'Leads strategy and client partnerships across the region.', ar: 'تقود الاستراتيجية والشراكات في المنطقة.' }, photo: 'https://picsum.photos/seed/team-1/700/800', linkedin: '#', email: 'layla@nexus.studio' },
      { name: { en: 'Daniel Okafor', ar: 'دانيال أوكافور' }, role: { en: 'Head of Design', ar: 'رئيس التصميم' }, bio: { en: 'Builds design systems that scale across dozens of products.', ar: 'يبني أنظمة تصميم قابلة للتوسع عبر عشرات المنتجات.' }, photo: 'https://picsum.photos/seed/team-2/700/800', linkedin: '#', email: 'daniel@nexus.studio' },
      { name: { en: 'Mina Park', ar: 'مينا بارك' }, role: { en: 'Engineering Lead', ar: 'قائدة الهندسة' }, bio: { en: 'Ships resilient front-end architecture and performance tooling.', ar: 'تبني معمارية واجهة متينة وأدوات أداء.' }, photo: 'https://picsum.photos/seed/team-3/700/800', linkedin: '#', email: 'mina@nexus.studio' },
      { name: { en: 'Idris Rahman', ar: 'إدريس رحمن' }, role: { en: 'Growth Strategist', ar: 'استراتيجي النمو' }, bio: { en: 'Turns analytics into experiments that compound.', ar: 'يحوّل التحليلات إلى تجارب متراكم أثرها.' }, photo: 'https://picsum.photos/seed/team-4/700/800', linkedin: '#', email: 'idris@nexus.studio' },
    ],
    testimonials: [
      { name: { en: 'Hala Nasser', ar: 'هالة ناصر' }, role: { en: 'Operations Director', ar: 'مديرة العمليات' }, company: { en: 'Verdant Group', ar: 'مجموعة فيردانت' }, quote: { en: 'The new site doubled our qualified enquiries in eight weeks. The team felt like an extension of ours.', ar: 'ضاعف الموقع الجديد استفساراتنا المؤهلة في ثمانية أسابيع. كان الفريق امتداداً لفريقنا.' }, rating: 5, avatar: 'https://picsum.photos/seed/tst-1/200/200', featured: true },
      { name: { en: 'Marco Bellini', ar: 'ماركو بيليني' }, role: { en: 'Founder', ar: 'مؤسس' }, company: { en: 'Copper Table', ar: 'طاولة كوبر' }, quote: { en: 'Bookings from the website are up 61% and the admin panel is genuinely easy for our staff.', ar: 'زادت الحجوزات من الموقع بنسبة 61% ولوحة الإدارة سهلة حقاً لفريقنا.' }, rating: 5, avatar: 'https://picsum.photos/seed/tst-2/200/200', featured: true },
      { name: { en: 'Dr. Amira Fahmy', ar: 'د. أميرة فهمي' }, role: { en: 'Clinic Owner', ar: 'مالكة العيادة' }, company: { en: 'Aurora Clinics', ar: 'عيادات أورورا' }, quote: { en: 'Patients book themselves now. No-shows dropped by a third after launch.', ar: 'يحجز المرضى بأنفسهم الآن. انخفض عدم الحضور بمقدار الثلث بعد الإطلاق.' }, rating: 5, avatar: 'https://picsum.photos/seed/tst-3/200/200', featured: true },
      { name: { en: 'Tomas Lindqvist', ar: 'توماس ليندكفيست' }, role: { en: 'CMO', ar: 'مدير التسويق' }, company: { en: 'Northwind', ar: 'نورث ويند' }, quote: { en: 'We shipped eleven localised pages without filing a single developer ticket.', ar: 'أطلقنا أحد عشر صفحة مترجمة دون أي تذكرة تطوير.' }, rating: 4, avatar: 'https://picsum.photos/seed/tst-4/200/200', featured: false },
    ],
    faq: [
      { question: { en: 'How long does a project take?', ar: 'كم يستغرق المشروع؟' }, answer: { en: 'Most marketing sites go live within three to six weeks depending on scope and content readiness.', ar: 'معظم مواقع التسويق تُطلق خلال ثلاثة إلى ستة أسابيع حسب النطاق وجاهزية المحتوى.' }, category: { en: 'Timeline', ar: 'الجدول الزمني' } },
      { question: { en: 'Do you work with our existing brand?', ar: 'هل تعملون بهويتنا الحالية؟' }, answer: { en: 'Yes — we extend your guidelines into a full design system and flag any gaps we find.', ar: 'نعم — نوسّع إرشاداتك إلى نظام تصميم كامل ونشير إلى أي فجوات.' }, category: { en: 'Design', ar: 'التصميم' } },
      { question: { en: 'Can we edit content ourselves?', ar: 'هل يمكننا تعديل المحتوى بأنفسنا؟' }, answer: { en: 'Absolutely. Every section is editable from the client admin panel, with no code required.', ar: 'بالتأكيد. كل قسم قابل للتعديل من لوحة إدارة العميل بدون كود.' }, category: { en: 'Content', ar: 'المحتوى' } },
      { question: { en: 'Is Arabic supported properly?', ar: 'هل العربية مدعومة بشكل صحيح؟' }, answer: { en: 'Yes — every layout mirrors for right-to-left, including icons, spacing and typography.', ar: 'نعم — كل تخطيط ينعكس للكتابة من اليمين لليسار، بما يشمل الأيقونات والمسافات والخطوط.' }, category: { en: 'Localisation', ar: 'التعريب' } },
      { question: { en: 'What happens after launch?', ar: 'ماذا يحدث بعد الإطلاق؟' }, answer: { en: 'You get 30 days of support plus optional care plans covering content, hosting and performance.', ar: 'تحصل على 30 يوماً من الدعم مع خطط رعاية اختيارية للمحتوى والاستضافة والأداء.' }, category: { en: 'Support', ar: 'الدعم' } },
      { question: { en: 'How is pricing structured?', ar: 'كيف تُحدَّد الأسعار؟' }, answer: { en: 'Fixed scope, fixed price. You approve a detailed estimate before we start any work.', ar: 'نطاق ثابت وسعر ثابت. توافق على تقدير مفصّل قبل بدء أي عمل.' }, category: { en: 'Pricing', ar: 'الأسعار' } },
    ],
    locations: [
      { name: { en: 'Marina Flagship', ar: 'فرع المارينا الرئيسي' }, address: { en: '24 Marina Boulevard', ar: '24 شارع المارينا' }, city: { en: 'Dubai', ar: 'دبي' }, phone: '+971 4 555 0142', hours: { en: 'Sun–Thu 9:00–21:00', ar: 'الأحد–الخميس 9:00–21:00' }, mapUrl: '', image: 'https://picsum.photos/seed/loc-1/800/600' },
      { name: { en: 'Downtown Studio', ar: 'استوديو وسط المدينة' }, address: { en: 'Bay Square, Building 7', ar: 'باي سكوير، مبنى 7' }, city: { en: 'Dubai', ar: 'دبي' }, phone: '+971 4 555 0198', hours: { en: 'Daily 10:00–22:00', ar: 'يومياً 10:00–22:00' }, mapUrl: '', image: 'https://picsum.photos/seed/loc-2/800/600' },
      { name: { en: 'Creek Harbour Kiosk', ar: 'كشك خور دبي' }, address: { en: 'Creek Promenade, Kiosk 3', ar: 'ممشى الخور، كشك 3' }, city: { en: 'Dubai', ar: 'دبي' }, phone: '+971 4 555 0111', hours: { en: 'Fri–Sun 11:00–20:00', ar: 'الجمعة–الأحد 11:00–20:00' }, mapUrl: '', image: 'https://picsum.photos/seed/loc-3/800/600' },
    ],
    pricing: [
      { name: { en: 'Starter', ar: 'المبتدئ' }, tagline: { en: 'For a single landing page', ar: 'لصفحة هبوط واحدة' }, price: { amount: 0, currency: 'USD' }, period: { en: '/ month', ar: '/ شهر' }, features: [{ en: '1 page', ar: 'صفحة واحدة' }, { en: 'Nexus subdomain', ar: 'نطاق فرعي' }, { en: 'Community support', ar: 'دعم المجتمع' }, { en: '5 CMS items', ar: '5 عناصر محتوى' }], highlight: false, cta: { en: 'Start free', ar: 'ابدأ مجاناً' } },
      { name: { en: 'Growth', ar: 'النمو' }, tagline: { en: 'For growing businesses', ar: 'للشركات النامية' }, price: { amount: 89, currency: 'USD' }, period: { en: '/ month', ar: '/ شهر' }, features: [{ en: '25 pages', ar: '25 صفحة' }, { en: 'Custom domain', ar: 'نطاق مخصص' }, { en: 'Bilingual EN / AR', ar: 'ثنائي اللغة' }, { en: '500 CMS items', ar: '500 عنصر محتوى' }, { en: 'Priority support', ar: 'دعم ذو أولوية' }], highlight: true, cta: { en: 'Choose Growth', ar: 'اختر النمو' } },
      { name: { en: 'Enterprise', ar: 'المؤسسات' }, tagline: { en: 'For multi-brand groups', ar: 'للمجموعات متعددة العلامات' }, price: { amount: 249, currency: 'USD' }, period: { en: '/ month', ar: '/ شهر' }, features: [{ en: 'Unlimited pages', ar: 'صفحات غير محدودة' }, { en: 'Multiple sites', ar: 'مواقع متعددة' }, { en: 'SSO & audit log', ar: 'الدخول الموحد وسجل التدقيق' }, { en: '99.95% SLA', ar: 'اتفاقية خدمة 99.95%' }, { en: 'Named success manager', ar: 'مدير نجاح مخصص' }], highlight: false, cta: { en: 'Talk to sales', ar: 'تحدث مع المبيعات' } },
    ],
    services: [
      { title: { en: 'Website design', ar: 'تصميم المواقع' }, icon: 'Palette', duration: { en: '4–6 weeks', ar: '4–6 أسابيع' }, price: { amount: 4800, currency: 'USD' }, category: { en: 'Design', ar: 'التصميم' }, featured: true, summary: { en: 'Research-led design with a full component library.', ar: 'تصميم قائم على البحث مع مكتبة مكونات كاملة.' } },
      { title: { en: 'Web development', ar: 'تطوير الويب' }, icon: 'Code', duration: { en: '6–10 weeks', ar: '6–10 أسابيع' }, price: { amount: 7200, currency: 'USD' }, category: { en: 'Build', ar: 'البناء' }, featured: true, summary: { en: 'Production-grade front-end with performance budgets.', ar: 'واجهة جاهزة للإنتاج مع موازنات أداء.' } },
      { title: { en: 'SEO & content', ar: 'تحسين محركات البحث والمحتوى' }, icon: 'TrendingUp', duration: { en: 'Ongoing', ar: 'مستمر' }, price: { amount: 1400, currency: 'USD', suffix: { en: '/ month', ar: '/ شهر' } }, category: { en: 'Growth', ar: 'النمو' }, featured: false, summary: { en: 'Technical SEO, content ops and reporting.', ar: 'تحسين تقني وعمليات محتوى وتقارير.' } },
      { title: { en: 'Brand identity', ar: 'الهوية البصرية' }, icon: 'Sparkles', duration: { en: '3–4 weeks', ar: '3–4 أسابيع' }, price: { amount: 3600, currency: 'USD' }, category: { en: 'Brand', ar: 'العلامة' }, featured: false, summary: { en: 'Logo, palette, type system and guidelines.', ar: 'شعار ولوحة ألوان ونظام خطوط وإرشادات.' } },
    ],
    menu: [
      { name: { en: 'Truffle Arancini', ar: 'أرانتشيني الكمأة' }, section: { en: 'Starters', ar: 'المقبلات' }, price: { amount: 48, currency: 'AED' }, tags: [{ en: 'Vegetarian', ar: 'نباتي' }], spicy: false, image: 'https://picsum.photos/seed/menu-1/800/600', description: { en: 'Crisp risotto spheres, black truffle, parmesan cream.', ar: 'كرات ريزوتو مقرمشة، كمأة سوداء، كريمة بارميزان.' } },
      { name: { en: 'Harissa Lamb Ribs', ar: 'أضلاع لحم بالهريسة' }, section: { en: 'Grill', ar: 'المشاوي' }, price: { amount: 96, currency: 'AED' }, tags: [{ en: 'Signature', ar: 'طبق الشيف' }], spicy: true, image: 'https://picsum.photos/seed/menu-2/800/600', description: { en: 'Slow-cooked ribs glazed with harissa and date molasses.', ar: 'أضلاع مطهوة ببطء مع الهريسة ودبس التمر.' } },
      { name: { en: 'Saffron Seafood Risotto', ar: 'ريزوتو المأكولات البحرية بالزعفران' }, section: { en: 'Mains', ar: 'الأطباق الرئيسية' }, price: { amount: 88, currency: 'AED' }, tags: [{ en: 'Gluten free', ar: 'خالٍ من الغلوتين' }], spicy: false, image: 'https://picsum.photos/seed/menu-3/800/600', description: { en: 'Carnaroli rice, prawns, mussels, saffron bisque.', ar: 'أرز كارنارولي، روبيان، بلح البحر، شوربة الزعفران.' } },
      { name: { en: 'Charred Cauliflower Steak', ar: 'ستيك القرنبيط المشوي' }, section: { en: 'Mains', ar: 'الأطباق الرئيسية' }, price: { amount: 62, currency: 'AED' }, tags: [{ en: 'Vegan', ar: 'نباتي صرف' }], spicy: false, image: 'https://picsum.photos/seed/menu-4/800/600', description: { en: 'Tahini, pomegranate, toasted almond, herbs.', ar: 'طحينة، رمّان، لوز محمص، أعشاب.' } },
      { name: { en: 'Pistachio Baklava Cheesecake', ar: 'تشيز كيك البقلاوة بالفستق' }, section: { en: 'Desserts', ar: 'الحلويات' }, price: { amount: 42, currency: 'AED' }, tags: [{ en: 'Popular', ar: 'شائع' }], spicy: false, image: 'https://picsum.photos/seed/menu-5/800/600', description: { en: 'Layered filo, pistachio cream, rose syrup.', ar: 'طبقات فيلو، كريمة الفستق، شراب الورد.' } },
      { name: { en: 'Cardamom Cold Brew', ar: 'كولد برو بالهيل' }, section: { en: 'Drinks', ar: 'المشروبات' }, price: { amount: 28, currency: 'AED' }, tags: [{ en: 'Signature', ar: 'طبق الشيف' }], spicy: false, image: 'https://picsum.photos/seed/menu-6/800/600', description: { en: '18-hour cold brew with cardamom and orange peel.', ar: 'كولد برو 18 ساعة مع الهيل وقشر البرتقال.' } },
    ],
    posts: [
      { title: { en: 'Designing for right-to-left from the start', ar: 'التصميم من اليمين لليسار من البداية' }, category: { en: 'Design', ar: 'التصميم' }, author: { en: 'Daniel Okafor', ar: 'دانيال أوكافور' }, date: '2026-01-18', readTime: { en: '6 min read', ar: 'قراءة 6 دقائق' }, image: 'https://picsum.photos/seed/post-1/1200/800', excerpt: { en: 'Mirroring is not a translation task. Here is how we bake RTL into the component layer.', ar: 'الانعكاس ليس مهمة ترجمة. هكذا ندمج RTL في طبقة المكونات.' } },
      { title: { en: 'The CMS patterns that keep editors happy', ar: 'أنماط إدارة المحتوى التي تُرضي المحررين' }, category: { en: 'Product', ar: 'المنتج' }, author: { en: 'Mina Park', ar: 'مينا بارك' }, date: '2026-02-04', readTime: { en: '8 min read', ar: 'قراءة 8 دقائق' }, image: 'https://picsum.photos/seed/post-2/1200/800', excerpt: { en: 'Structure content around decisions, not database tables.', ar: 'نظّم المحتوى حول القرارات لا حول جداول قواعد البيانات.' } },
      { title: { en: 'Performance budgets for marketing sites', ar: 'موازنات الأداء لمواقع التسويق' }, category: { en: 'Engineering', ar: 'الهندسة' }, author: { en: 'Mina Park', ar: 'مينا بارك' }, date: '2026-02-22', readTime: { en: '5 min read', ar: 'قراءة 5 دقائق' }, image: 'https://picsum.photos/seed/post-3/1200/800', excerpt: { en: 'A practical budget that keeps LCP under two seconds on 4G.', ar: 'موازنة عملية تحافظ على LCP أقل من ثانيتين على شبكة 4G.' } },
    ],
    events: [
      { title: { en: 'Property Investment Masterclass', ar: 'ورشة الاستثمار العقاري' }, date: '2026-03-12', time: '18:00', venue: { en: 'Marina Flagship', ar: 'فرع المارينا الرئيسي' }, price: { amount: 0, currency: 'AED' }, image: 'https://picsum.photos/seed/evt-1/1000/700', description: { en: 'Two hours with our senior brokers on yields and financing.', ar: 'ساعتان مع كبار وسطائنا حول العوائد والتمويل.' } },
      { title: { en: 'Open Day: Creek Harbour', ar: 'يوم مفتوح: خور دبي' }, date: '2026-03-21', time: '11:00', venue: { en: 'Creek Harbour Kiosk', ar: 'كشك خور دبي' }, price: { amount: 0, currency: 'AED' }, image: 'https://picsum.photos/seed/evt-2/1000/700', description: { en: 'Tour four new townhouses with an interior designer.', ar: 'جولة في أربعة تاون هاوس جديدة مع مصمم داخلي.' } },
      { title: { en: 'Interior Styling Workshop', ar: 'ورشة تنسيق الديكور' }, date: '2026-04-05', time: '16:30', venue: { en: 'Downtown Studio', ar: 'استوديو وسط المدينة' }, price: { amount: 150, currency: 'AED' }, image: 'https://picsum.photos/seed/evt-3/1000/700', description: { en: 'Hands-on session covering colour, lighting and layout.', ar: 'جلسة تطبيقية تغطي الألوان والإضاءة والتخطيط.' } },
    ],
  }
  const schema = COLLECTIONS[key]
  if (!schema) return []
  const base = seeds[key] ?? []
  if (base.length) return clone(base)
  return []
}

export const DEFAULT_LANGS: Lang[] = ['en', 'ar']
