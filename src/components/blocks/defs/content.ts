import type { BlockDefinition } from '../../../lib/schema'
import { T, img } from './helpers'

export const richTextBlock: BlockDefinition = {
  type: 'richText',
  label: 'Rich text',
  category: 'content',
  icon: 'FileText',
  description: 'Editorial block with heading, prose, bullet list and pull quote.',
  defaults: () => ({
    eyebrow: T('Our story', 'قصتنا'),
    heading: T('Built for teams who care about the details', 'مصمم لفرق تهتم بالتفاصيل'),
    body: T('We combine research, design and engineering into a single accountable team. Every engagement starts with a clear plan and ends with measurable outcomes your board can see.', 'نجمع البحث والتصميم والهندسة في فريق واحد مسؤول. تبدأ كل مهمة بخطة واضحة وتنتهي بنتائج قابلة للقياس.'),
    quote: T('Clarity beats cleverness — every single time.', 'الوضوح يتفوق على الذكاء — في كل مرة.'),
    quoteAuthor: T('Layla Haddad, Managing Partner', 'ليلى حداد، الشريك الإداري'),
    align: 'left',
    twoColumn: true,
    showImage: true,
    image: img('richtext', 1000, 800),
    showBullets: true,
    bullets: [{ text: T('Senior-only delivery team', 'فريق تنفيذي بخبرة عالية') }, { text: T('Weekly demos and reporting', 'عروض وتقارير أسبوعية') }, { text: T('Fixed scope, fixed price', 'نطاق وسعر ثابتان') }],
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Content' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Content' },
    { key: 'body', label: 'Body copy', type: 'localizedTextarea', group: 'Content' },
    { key: 'showBullets', label: 'Show bullet list', type: 'toggle', group: 'Content' },
    {
      key: 'bullets', label: 'Bullets', type: 'items', group: 'Content', when: (p) => !!p.showBullets,
      itemFields: [{ key: 'text', label: 'Text', type: 'localizedText' }],
      itemDefaults: () => ({ text: T('Point', 'نقطة') }),
      itemLabel: (i) => i?.text?.en || 'Point',
    },
    { key: 'quote', label: 'Pull quote', type: 'localizedTextarea', group: 'Quote' },
    { key: 'quoteAuthor', label: 'Quote attribution', type: 'localizedText', group: 'Quote' },
    { key: 'showImage', label: 'Show image', type: 'toggle', group: 'Media' },
    { key: 'image', label: 'Image', type: 'image', group: 'Media', when: (p) => !!p.showImage },
    { key: 'twoColumn', label: 'Two column layout', type: 'toggle', group: 'Layout' },
    { key: 'align', label: 'Text alignment', type: 'select', group: 'Layout', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'body', label: 'Body', fieldKey: 'body' },
    { key: 'quote', label: 'Quote', fieldKey: 'quote' },
    { key: 'media', label: 'Media' },
  ],
}

export const imageTextBlock: BlockDefinition = {
  type: 'imageText',
  label: 'Image + text',
  category: 'content',
  icon: 'Image',
  description: 'Alternating media and copy with checklist, stat card and CTA.',
  defaults: () => ({
    eyebrow: T('How it works', 'كيف يعمل'),
    heading: T('A process that removes the guesswork', 'عملية تزيل التخمين'),
    body: T('From discovery to launch we keep you in the loop with weekly milestones, shared boards and clear owners.', 'من الاستكشاف حتى الإطلاق نبقيك على اطلاع بمعالم أسبوعية ولوحات مشتركة ومسؤولين واضحين.'),
    image: img('imagetext', 1100, 900),
    mediaSide: 'left',
    bullets: [{ text: T('Discovery workshop in week one', 'ورشة استكشاف في الأسبوع الأول') }, { text: T('Design system and prototypes', 'نظام تصميم ونماذج أولية') }, { text: T('Launch, measure, iterate', 'إطلاق وقياس وتحسين') }],
    primaryCta: { label: T('See the process', 'شاهد العملية'), href: '/services', variant: 'primary', size: 'lg', hover: 'lift', icon: '', iconRight: 'ArrowRight' },
    statOn: true,
    statValue: '98%',
    statLabel: T('Client retention', 'احتفاظ العملاء'),
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Content' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Content' },
    { key: 'body', label: 'Body', type: 'localizedTextarea', group: 'Content' },
    {
      key: 'bullets', label: 'Checklist', type: 'items', group: 'Content',
      itemFields: [{ key: 'text', label: 'Text', type: 'localizedText' }],
      itemDefaults: () => ({ text: T('Point', 'نقطة') }),
      itemLabel: (i) => i?.text?.en || 'Point',
    },
    { key: 'image', label: 'Image', type: 'image', group: 'Media' },
    { key: 'mediaSide', label: 'Media side', type: 'select', group: 'Media', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
    { key: 'primaryCta.label', label: 'Button label', type: 'localizedText', group: 'Actions' },
    { key: 'primaryCta.href', label: 'Button link', type: 'link', group: 'Actions' },
    { key: 'statOn', label: 'Show stat card', type: 'toggle', group: 'Media' },
    { key: 'statValue', label: 'Stat value', type: 'text', group: 'Media', when: (p) => !!p.statOn },
    { key: 'statLabel', label: 'Stat label', type: 'localizedText', group: 'Media', when: (p) => !!p.statOn },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'body', label: 'Body', fieldKey: 'body' },
    { key: 'media', label: 'Media' },
    { key: 'primaryCta.button', label: 'Button', fieldKey: 'primaryCta.label' },
  ],
}

export const statsBlock: BlockDefinition = {
  type: 'stats',
  label: 'Stats counter',
  category: 'content',
  icon: 'BarChart3',
  description: 'Numeric proof points with icons and descriptions.',
  defaults: () => ({
    eyebrow: T('By the numbers', 'بالأرقام'),
    heading: T('Momentum you can measure', 'زخم يمكن قياسه'),
    subheading: T('', ''),
    align: 'center',
    variant: 'cards',
    items: [
      { icon: 'TrendingUp', value: '3.4x', label: T('Average revenue lift', 'نمو الإيرادات'), text: T('Across 40+ engagements in 2025.', 'خلال أكثر من 40 مهمة في 2025.') },
      { icon: 'Users', value: '12k+', label: T('Active clients', 'عميل نشط'), text: T('From startups to enterprise groups.', 'من الشركات الناشئة إلى المجموعات الكبرى.') },
      { icon: 'Clock', value: '36h', label: T('Average launch time', 'متوسط زمن الإطلاق'), text: T('From approved design to live site.', 'من التصميم المعتمد إلى الموقع المباشر.') },
      { icon: 'Award', value: '4.9', label: T('Satisfaction score', 'درجة الرضا'), text: T('Verified across 2,100 reviews.', 'موثقة عبر 2,100 تقييم.') },
    ],
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Heading' },
    { key: 'subheading', label: 'Subheading', type: 'localizedTextarea', group: 'Heading' },
    { key: 'align', label: 'Alignment', type: 'select', group: 'Heading', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    {
      key: 'variant', label: 'Style', type: 'select', group: 'Appearance',
      options: [
        { value: 'cards', label: 'Cards' },
        { value: 'bare', label: 'Bare' },
        { value: 'strip', label: 'Strip' },
        { value: 'dark', label: 'Dark panel' },
      ],
    },
    {
      key: 'items', label: 'Stats', type: 'items', group: 'Content',
      itemFields: [
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'value', label: 'Value', type: 'text' },
        { key: 'label', label: 'Label', type: 'localizedText' },
        { key: 'text', label: 'Description', type: 'localizedTextarea' },
      ],
      itemDefaults: () => ({ icon: 'Sparkles', value: '100+', label: T('Metric', 'مقياس'), text: T('', '') }),
      itemLabel: (i) => i?.label?.en || 'Stat',
    },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'items', label: 'Stats' },
  ],
}

export const stepsBlock: BlockDefinition = {
  type: 'steps',
  label: 'Process steps',
  category: 'content',
  icon: 'Route',
  description: 'Numbered steps with connectors, icons and descriptions.',
  defaults: () => ({
    eyebrow: T('Process', 'العملية'),
    heading: T('Three steps to launch', 'ثلاث خطوات للإطلاق'),
    subheading: T('', ''),
    align: 'center',
    variant: 'numbered',
    items: [
      { icon: 'Lightbulb', title: T('Share your brief', 'شارك متطلباتك'), text: T('Tell us your goals, audience and timeline in a 20-minute call.', 'أخبرنا بأهدافك وجمهورك وجدولك الزمني في مكالمة 20 دقيقة.') },
      { icon: 'PenLine', title: T('Review the design', 'راجع التصميم'), text: T('We return a clickable prototype with copy and imagery in place.', 'نعيد نموذجاً تفاعلياً بالنصوص والصور جاهزة.') },
      { icon: 'Rocket', title: T('Launch and grow', 'أطلق وانمُ'), text: T('We publish, wire analytics and iterate on real user data.', 'ننشر ونربط التحليلات ونحسّن بناءً على بيانات المستخدمين.') },
    ],
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Heading' },
    { key: 'subheading', label: 'Subheading', type: 'localizedTextarea', group: 'Heading' },
    { key: 'align', label: 'Alignment', type: 'select', group: 'Heading', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    {
      key: 'variant', label: 'Style', type: 'select', group: 'Appearance',
      options: [
        { value: 'numbered', label: 'Numbered' },
        { value: 'timeline', label: 'Timeline' },
        { value: 'cards', label: 'Cards' },
      ],
    },
    {
      key: 'items', label: 'Steps', type: 'items', group: 'Content',
      itemFields: [
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'title', label: 'Title', type: 'localizedText' },
        { key: 'text', label: 'Text', type: 'localizedTextarea' },
      ],
      itemDefaults: () => ({ icon: 'Sparkles', title: T('Step', 'خطوة'), text: T('', '') }),
      itemLabel: (i) => i?.title?.en || 'Step',
    },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'items', label: 'Steps' },
  ],
}

export const tabsBlock: BlockDefinition = {
  type: 'tabs',
  label: 'Tabs / segmented',
  category: 'content',
  icon: 'Columns3',
  description: 'Tabbed content panels for dense information with media.',
  defaults: () => ({
    eyebrow: T('Explore', 'استكشف'),
    heading: T('Everything included', 'كل شيء مشمول'),
    variant: 'pill',
    tabs: [
      { label: T('Design', 'التصميم'), heading: T('Design system ready', 'نظام تصميم جاهز'), body: T('Tokens, components and dark mode baked in from day one.', 'رموز ومكونات ووضع داكن من اليوم الأول.'), bullets: [T('Design tokens', 'رموز التصميم'), T('Responsive grid', 'شبكة متجاوبة')], image: img('tab-1', 900, 700) },
      { label: T('Build', 'البناء'), heading: T('Production build', 'بناء جاهز للإنتاج'), body: T('Semantic markup, accessible components and optimised assets.', 'ترميز دلالي ومكونات قابلة للوصول وأصول محسّنة.'), bullets: [T('Accessibility', 'إمكانية الوصول'), T('Core Web Vitals', 'مؤشرات الأداء')], image: img('tab-2', 900, 700) },
      { label: T('Grow', 'النمو'), heading: T('Measure and iterate', 'قِس وحسّن'), body: T('Analytics, experiments and content operations handled for you.', 'التحليلات والتجارب وعمليات المحتوى نديرها لك.'), bullets: [T('A/B testing', 'اختبار A/B'), T('SEO', 'تحسين محركات البحث')], image: img('tab-3', 900, 700) },
    ],
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Heading' },
    { key: 'variant', label: 'Tab style', type: 'select', group: 'Appearance', options: [{ value: 'pill', label: 'Pill' }, { value: 'underline', label: 'Underline' }, { value: 'segmented', label: 'Segmented' }] },
    {
      key: 'tabs', label: 'Tabs', type: 'items', group: 'Content',
      itemFields: [
        { key: 'label', label: 'Tab label', type: 'localizedText' },
        { key: 'heading', label: 'Heading', type: 'localizedText' },
        { key: 'body', label: 'Body', type: 'localizedTextarea' },
        { key: 'bullets', label: 'Bullets', type: 'tags', localized: true },
        { key: 'image', label: 'Image', type: 'image' },
      ],
      itemDefaults: () => ({ label: T('Tab', 'تبويب'), heading: T('Heading', 'عنوان'), body: T('', ''), bullets: [], image: img('tab-new', 900, 700) }),
      itemLabel: (i) => i?.label?.en || 'Tab',
    },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'tabs', label: 'Tabs' },
  ],
}

export const featureGridBlock: BlockDefinition = {
  type: 'featureGrid',
  label: 'Feature grid',
  category: 'content',
  icon: 'Blocks',
  description: 'Icon feature cards with flexible columns and card variants.',
  defaults: () => ({
    eyebrow: T('Why us', 'لماذا نحن'),
    heading: T('Everything you need in one platform', 'كل ما تحتاجه في منصة واحدة'),
    subheading: T('Powerful primitives that stay fast, accessible and on-brand.', 'أدوات قوية تبقى سريعة وقابلة للوصول ومتسقة مع هويتك.'),
    align: 'center',
    columns: 3,
    variant: 'card',
    items: [
      { icon: 'Zap', title: T('Instant publishing', 'نشر فوري'), text: T('Ship content changes in seconds with zero downtime.', 'انشر تغييرات المحتوى في ثوانٍ دون توقف.') },
      { icon: 'Shield', title: T('Enterprise security', 'أمان للمؤسسات'), text: T('Role-based access, audit trails and encrypted storage.', 'وصول بالأدوار وسجلات تدقيق وتخزين مشفر.') },
      { icon: 'Languages', title: T('Native RTL & i18n', 'دعم RTL والترجمة'), text: T('Arabic and English layouts that adapt automatically.', 'تخطيطات عربية وإنجليزية تتكيف تلقائياً.') },
      { icon: 'Gauge', title: T('Blazing performance', 'أداء فائق'), text: T('Optimised bundles, lazy media and edge-ready output.', 'حزم محسّنة ووسائط مؤجلة وجاهزية للحافة.') },
      { icon: 'Palette', title: T('Design tokens', 'رموز التصميم'), text: T('Retheme an entire site from a single palette.', 'أعد تلوين الموقع بالكامل من لوحة واحدة.') },
      { icon: 'Plug', title: T('Integrations', 'التكاملات'), text: T('Analytics, CRM and payments connect in a click.', 'التحليلات وإدارة العملاء والمدفوعات بتكليكة.') },
    ],
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Heading' },
    { key: 'subheading', label: 'Subheading', type: 'localizedTextarea', group: 'Heading' },
    { key: 'align', label: 'Heading alignment', type: 'select', group: 'Heading', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
    { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4, step: 1, group: 'Layout' },
    {
      key: 'variant', label: 'Card style', type: 'select', group: 'Layout',
      options: [
        { value: 'card', label: 'Elevated card' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'glass', label: 'Glass' },
        { value: 'bare', label: 'Bare' },
        { value: 'spotlight', label: 'Spotlight (first large)' },
      ],
    },
    {
      key: 'items', label: 'Features', type: 'items', group: 'Content',
      itemFields: [
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'title', label: 'Title', type: 'localizedText' },
        { key: 'text', label: 'Text', type: 'localizedTextarea' },
        { key: 'href', label: 'Link', type: 'link' },
        { key: 'badge', label: 'Badge', type: 'localizedText' },
      ],
      itemDefaults: () => ({ icon: 'Sparkles', title: T('Feature', 'ميزة'), text: T('', '') }),
      itemLabel: (i) => i?.title?.en || 'Feature',
    },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'items', label: 'Features' },
  ],
}

export const galleryBlock: BlockDefinition = {
  type: 'gallery',
  label: 'Gallery',
  category: 'content',
  icon: 'Grid2x2',
  description: 'Uniform, masonry or carousel image gallery with captions.',
  defaults: () => ({
    eyebrow: T('Portfolio', 'الأعمال'),
    heading: T('Selected work', 'أعمال مختارة'),
    subheading: T('A snapshot of recent projects across sectors.', 'لمحة من المشاريع الحديثة في قطاعات متعددة.'),
    align: 'center',
    layout: 'masonry',
    columns: 3,
    items: [
      { image: img('g1', 900, 1200), title: T('Skyline Residences', 'مساكن سكاي لاين'), tag: T('Real estate', 'عقارات') },
      { image: img('g2', 1200, 900), title: T('Aurora Clinic', 'عيادة أورورا'), tag: T('Healthcare', 'الرعاية الصحية') },
      { image: img('g3', 900, 900), title: T('Verdant Market', 'سوق فيردانت'), tag: T('Retail', 'التجزئة') },
      { image: img('g4', 1200, 900), title: T('Copper Table', 'طاولة كوبر'), tag: T('Hospitality', 'الضيافة') },
      { image: img('g5', 900, 1100), title: T('Lattice HQ', 'مقر لاتيس'), tag: T('Corporate', 'الشركات') },
      { image: img('g6', 1200, 800), title: T('Blue Harbor', 'مرفأ أزرق'), tag: T('Travel', 'السفر') },
    ],
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Heading' },
    { key: 'subheading', label: 'Subheading', type: 'localizedTextarea', group: 'Heading' },
    { key: 'align', label: 'Heading alignment', type: 'select', group: 'Heading', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    {
      key: 'layout', label: 'Layout', type: 'select', group: 'Layout',
      options: [
        { value: 'grid', label: 'Uniform grid' },
        { value: 'masonry', label: 'Masonry' },
        { value: 'carousel', label: 'Carousel' },
      ],
    },
    { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4, step: 1, group: 'Layout' },
    {
      key: 'items', label: 'Images', type: 'items', group: 'Content',
      itemFields: [
        { key: 'image', label: 'Image', type: 'image' },
        { key: 'title', label: 'Caption', type: 'localizedText' },
        { key: 'tag', label: 'Tag', type: 'localizedText' },
      ],
      itemDefaults: () => ({ image: img('new-g', 900, 900), title: T('Project', 'مشروع'), tag: T('Category', 'فئة') }),
      itemLabel: (i) => i?.title?.en || 'Image',
    },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'items', label: 'Images' },
  ],
}

export const contentBlocks: BlockDefinition[] = [richTextBlock, imageTextBlock, statsBlock, stepsBlock, tabsBlock, featureGridBlock, galleryBlock]
