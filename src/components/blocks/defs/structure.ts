import type { BlockDefinition } from '../../../lib/schema'
import { T, img } from './helpers'

export const heroSearchBlock: BlockDefinition = {
  type: 'heroSearch',
  label: 'Hero + search filters',
  category: 'structure',
  icon: 'Search',
  description: 'Conversion hero with an advanced multi-field search bar (real estate / marketplace).',
  defaults: () => ({
    eyebrow: T('180+ cities · 24k listings', 'أكثر من 180 مدينة · 24 ألف عقار'),
    heading: T('Search smarter. Move faster.', 'ابحث بذكاء. انتقل أسرع.'),
    subheading: T('Filter by location, budget and lifestyle in seconds — then book a viewing instantly.', 'فلتر حسب الموقع والميزانية ونمط الحياة في ثوانٍ — ثم احجز المعاينة فوراً.'),
    backgroundImage: img('hero-search', 1920, 1080),
    overlay: 0.62,
    align: 'center',
    tabsOn: true,
    tabs: [{ label: T('Buy', 'شراء') }, { label: T('Rent', 'إيجار') }, { label: T('Commercial', 'تجاري') }],
    filters: [
      { kind: 'text', label: T('Location', 'الموقع'), placeholder: T('City, area or landmark', 'المدينة أو الحي أو معلم'), icon: 'MapPin' },
      {
        kind: 'select', label: T('Property type', 'نوع العقار'), icon: 'Home',
        options: [T('Any type', 'أي نوع'), T('Apartment', 'شقة'), T('Villa', 'فيلا'), T('Townhouse', 'تاون هاوس'), T('Office', 'مكتب')],
      },
      { kind: 'range', label: T('Max budget', 'أقصى ميزانية'), min: 0, max: 5000000, value: 1500000, prefix: '$' },
      { kind: 'select', label: T('Bedrooms', 'غرف النوم'), icon: 'Bed', options: [T('Any', 'الكل'), T('1', '١'), T('2', '٢'), T('3', '٣'), T('4+', '٤+')] },
    ],
    searchLabel: T('Search', 'بحث'),
    quickLinksOn: true,
    quickLabel: T('Popular:', 'شائع:'),
    quickLinks: [{ text: T('Downtown lofts', 'شقق وسط المدينة') }, { text: T('Sea view villas', 'فلل بإطلالة بحرية') }, { text: T('Family townhouses', 'تاون هاوس عائلي') }, { text: T('Smart offices', 'مكاتب ذكية') }],
    trustOn: true,
    trustItems: [
      { icon: 'Shield', text: T('Verified listings only', 'عقارات موثقة فقط') },
      { icon: 'Clock', text: T('Book in under 60 seconds', 'احجز في أقل من ٦٠ ثانية') },
      { icon: 'Users', text: T('3,400+ expert agents', 'أكثر من 3,400 وسيط خبير') },
    ],
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' },
    { key: 'heading', label: 'Headline', type: 'localizedText', group: 'Heading' },
    { key: 'subheading', label: 'Subheadline', type: 'localizedTextarea', group: 'Heading' },
    { key: 'align', label: 'Alignment', type: 'select', group: 'Heading', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    { key: 'backgroundImage', label: 'Background image', type: 'image', group: 'Media' },
    { key: 'overlay', label: 'Overlay strength', type: 'slider', min: 0, max: 0.9, step: 0.05, group: 'Media' },
    { key: 'tabsOn', label: 'Show search tabs', type: 'toggle', group: 'Search' },
    {
      key: 'tabs', label: 'Search tabs', type: 'items', group: 'Search', when: (p) => !!p.tabsOn,
      itemFields: [{ key: 'label', label: 'Label', type: 'localizedText' }],
      itemDefaults: () => ({ label: T('Tab', 'تبويب') }),
      itemLabel: (i) => i?.label?.en || 'Tab',
    },
    { key: 'searchLabel', label: 'Search button label', type: 'localizedText', group: 'Search' },
    {
      key: 'filters', label: 'Filter fields', type: 'items', group: 'Search',
      itemFields: [
        { key: 'label', label: 'Label', type: 'localizedText' },
        {
          key: 'kind', label: 'Control', type: 'select',
          options: [
            { value: 'text', label: 'Text input' },
            { value: 'select', label: 'Dropdown' },
            { value: 'range', label: 'Range slider' },
          ],
        },
        { key: 'placeholder', label: 'Placeholder', type: 'localizedText' },
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'prefix', label: 'Value prefix', type: 'text' },
        { key: 'min', label: 'Min', type: 'number' },
        { key: 'max', label: 'Max', type: 'number' },
        { key: 'value', label: 'Default', type: 'number' },
        { key: 'options', label: 'Options', type: 'tags', localized: true },
      ],
      itemDefaults: () => ({ kind: 'text', label: T('New filter', 'فلتر جديد'), placeholder: T('Any', 'الكل'), icon: 'Filter' }),
      itemLabel: (i) => i?.label?.en || 'Filter',
    },
    { key: 'quickLinksOn', label: 'Show quick links', type: 'toggle', group: 'Search' },
    { key: 'quickLabel', label: 'Quick links label', type: 'localizedText', group: 'Search', when: (p) => !!p.quickLinksOn },
    {
      key: 'quickLinks', label: 'Quick links', type: 'items', group: 'Search', when: (p) => !!p.quickLinksOn,
      itemFields: [{ key: 'text', label: 'Text', type: 'localizedText' }],
      itemDefaults: () => ({ text: T('Link', 'رابط') }),
      itemLabel: (i) => i?.text?.en || 'Link',
    },
    { key: 'trustOn', label: 'Show trust strip', type: 'toggle', group: 'Trust' },
    {
      key: 'trustItems', label: 'Trust items', type: 'items', group: 'Trust', when: (p) => !!p.trustOn,
      itemFields: [
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'text', label: 'Text', type: 'localizedText' },
      ],
      itemDefaults: () => ({ icon: 'Check', text: T('Benefit', 'ميزة') }),
      itemLabel: (i) => i?.text?.en || 'Item',
    },
  ],
  elements: [
    { key: 'heading', label: 'Headline', fieldKey: 'heading' },
    { key: 'subheading', label: 'Subheadline', fieldKey: 'subheading' },
    { key: 'search', label: 'Search panel' },
    { key: 'trust', label: 'Trust strip' },
  ],
}

export const ctaBandBlock: BlockDefinition = {
  type: 'ctaBand',
  label: 'CTA band',
  category: 'conversion',
  icon: 'Rocket',
  description: 'Full-width conversion band with headline, dual CTAs and avatar proof.',
  defaults: () => ({
    eyebrow: T('Ready when you are', 'جاهزون عندما تكون جاهزاً'),
    heading: T('Start your project with a free strategy call', 'ابدأ مشروعك بمكالمة استراتيجية مجانية'),
    subheading: T('We reply within one business day — no obligation, no pressure.', 'نرد خلال يوم عمل واحد — بدون التزام أو ضغط.'),
    primaryCta: { label: T('Book a call', 'احجز مكالمة'), href: '/contact', variant: 'dark', size: 'lg', hover: 'lift', icon: 'Calendar', iconRight: '' },
    secondaryCta: { label: T('See pricing', 'عرض الأسعار'), href: '/pricing', variant: 'glass', size: 'lg', hover: 'lift', icon: 'Tag', iconRight: '' },
    variant: 'gradient',
    backgroundImage: img('cta-band', 1800, 800),
    showAvatars: true,
    noteText: T('Join 12,000+ clients already growing with us', 'انضم إلى أكثر من 12,000 عميل ينمون معنا'),
    align: 'center',
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' },
    { key: 'heading', label: 'Heading', type: 'localizedText', group: 'Heading' },
    { key: 'subheading', label: 'Subheading', type: 'localizedTextarea', group: 'Heading' },
    { key: 'align', label: 'Alignment', type: 'select', group: 'Heading', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    {
      key: 'variant', label: 'Style', type: 'select', group: 'Appearance',
      options: [
        { value: 'gradient', label: 'Gradient' },
        { value: 'dark', label: 'Dark' },
        { value: 'soft', label: 'Soft' },
        { value: 'image', label: 'Image background' },
      ],
    },
    { key: 'backgroundImage', label: 'Background image', type: 'image', group: 'Appearance', when: (p) => p.variant === 'image' },
    ...['primaryCta', 'secondaryCta'].flatMap((k, i) => [
      { key: `${k}.label`, label: i === 0 ? 'Primary button' : 'Secondary button', type: 'localizedText' as const, group: 'Actions' },
      { key: `${k}.href`, label: 'Link', type: 'link' as const, group: 'Actions' },
      { key: `${k}.icon`, label: 'Icon', type: 'icon' as const, group: 'Actions' },
    ]),
    { key: 'showAvatars', label: 'Show avatar stack', type: 'toggle', group: 'Trust' },
    { key: 'noteText', label: 'Note text', type: 'localizedText', group: 'Trust', when: (p) => !!p.showAvatars },
  ],
  elements: [
    { key: 'heading', label: 'Heading', fieldKey: 'heading' },
    { key: 'subheading', label: 'Subheading', fieldKey: 'subheading' },
    { key: 'primaryCta.button', label: 'Primary button', fieldKey: 'primaryCta.label' },
    { key: 'secondaryCta.button', label: 'Secondary button', fieldKey: 'secondaryCta.label' },
    { key: 'avatars', label: 'Avatar stack' },
  ],
}

export const spacerBlock: BlockDefinition = {
  type: 'spacer',
  label: 'Spacer / divider',
  category: 'utility',
  icon: 'Minus',
  description: 'Whitespace or hairline divider between sections.',
  defaults: () => ({ size: 48, showLine: false, lineStyle: 'solid' }),
  fields: [
    { key: 'size', label: 'Height', type: 'slider', min: 8, max: 200, step: 4, group: 'Layout', unit: 'px' },
    { key: 'showLine', label: 'Show divider line', type: 'toggle', group: 'Layout' },
    {
      key: 'lineStyle', label: 'Line style', type: 'select', group: 'Layout', when: (p) => !!p.showLine,
      options: [
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'gradient', label: 'Gradient fade' },
      ],
    },
  ],
  elements: [{ key: 'spacer', label: 'Spacer' }],
}

export const structureBlocks: BlockDefinition[] = [heroSearchBlock, ctaBandBlock, spacerBlock]
