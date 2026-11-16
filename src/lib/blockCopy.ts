import type { BlockDefinition } from './schema'
import type { Lang } from './types'

/* ============================================================
   Localised section names for the editor chrome. The block
   definitions stay English-only (they also seed site copy), so
   the visible label/description is translated here by type.
   ============================================================ */

type Copy = { label: string; description: string }

export const BLOCK_COPY: Record<string, { en: Copy; ar: Copy }> = {
  header: {
    en: { label: 'Site header', description: 'Sticky navigation with logo, links, search, language switcher and CTA.' },
    ar: { label: 'ترويسة الموقع', description: 'تنقل ثابت مع الشعار والروابط والبحث ومبدّل اللغة وزر الإجراء.' },
  },
  announcement: {
    en: { label: 'Announcement bar', description: 'Slim promotional strip with marquee or static message.' },
    ar: { label: 'شريط الإعلانات', description: 'شريط ترويجي رفيع برسالة متحركة أو ثابتة.' },
  },
  hero: {
    en: { label: 'Hero — split media', description: 'High-conversion hero with headline, CTAs, trust stats and media panel.' },
    ar: { label: 'واجهة — وسائط مقسّمة', description: 'واجهة عالية التحويل مع عنوان وأزرار وإحصاءات ثقة ولوحة وسائط.' },
  },
  heroSearch: {
    en: { label: 'Hero + search filters', description: 'Conversion hero with an advanced multi-field search bar (real estate / marketplace).' },
    ar: { label: 'واجهة + فلاتر بحث', description: 'واجهة تحويل مع شريط بحث متقدم متعدد الحقول (عقارات / متجر).' },
  },
  richText: {
    en: { label: 'Rich text', description: 'Editorial block with heading, prose, bullet list and pull quote.' },
    ar: { label: 'نص منسّق', description: 'كتلة تحريرية مع عنوان ونص وقائمة نقطية واقتباس.' },
  },
  imageText: {
    en: { label: 'Image + text', description: 'Alternating media and copy with checklist, stat card and CTA.' },
    ar: { label: 'صورة + نص', description: 'وسائط ونص متبادلان مع قائمة تحقق وبطاقة إحصاء وزر إجراء.' },
  },
  stats: {
    en: { label: 'Stats counter', description: 'Numeric proof points with icons and descriptions.' },
    ar: { label: 'عدّاد الإحصاءات', description: 'أرقام داعمة مع أيقونات ووصف.' },
  },
  steps: {
    en: { label: 'Process steps', description: 'Numbered steps with connectors, icons and descriptions.' },
    ar: { label: 'خطوات العملية', description: 'خطوات مرقّمة مع وصلات وأيقونات ووصف.' },
  },
  tabs: {
    en: { label: 'Tabs / segmented', description: 'Tabbed content panels for dense information with media.' },
    ar: { label: 'تبويبات', description: 'لوحات محتوى بتبويبات لمعلومات كثيفة مع وسائط.' },
  },
  featureGrid: {
    en: { label: 'Feature grid', description: 'Icon feature cards with flexible columns and card variants.' },
    ar: { label: 'شبكة الميزات', description: 'بطاقات ميزات بأيقونات مع أعمدة مرنة وأنماط متعددة.' },
  },
  gallery: {
    en: { label: 'Gallery', description: 'Uniform, masonry or carousel image gallery with captions.' },
    ar: { label: 'معرض الصور', description: 'معرض صور منتظم أو متدرّج أو دوّار مع تعليقات.' },
  },
  blog: {
    en: { label: 'Blog / articles', description: 'Article cards with cover images, categories and read time.' },
    ar: { label: 'المدونة / المقالات', description: 'بطاقات مقالات مع صور الغلاف والتصنيفات وزمن القراءة.' },
  },
  banner: {
    en: { label: 'Image banner', description: 'Full-bleed image banner with overlay, eyebrow and CTA.' },
    ar: { label: 'لافتة صورة', description: 'لافتة صورة كاملة العرض مع طبقة تعتيم ونص علوي وزر إجراء.' },
  },
  table: {
    en: { label: 'Comparison table', description: 'Feature comparison table with sticky header and highlight column.' },
    ar: { label: 'جدول المقارنة', description: 'جدول مقارنة ميزات مع رأس ثابت وعمود مميّز.' },
  },
  video: {
    en: { label: 'Video / media', description: 'Embedded video or image poster with play overlay and caption.' },
    ar: { label: 'فيديو / وسائط', description: 'فيديو مدمج أو صورة غلاف مع زر تشغيل وتعليق.' },
  },
  listingGrid: {
    en: { label: 'Listing grid', description: 'Property, product or service cards bound to a CMS collection with filters.' },
    ar: { label: 'شبكة القوائم', description: 'بطاقات عقارات أو منتجات أو خدمات مرتبطة بمجموعة محتوى مع فلاتر.' },
  },
  booking: {
    en: { label: 'Booking / appointment', description: 'Appointment widget with doctor/service picker, date strip and time slots.' },
    ar: { label: 'الحجز / المواعيد', description: 'أداة حجز مع اختيار المختص أو الخدمة وشريط التواريخ وفترات الوقت.' },
  },
  menu: {
    en: { label: 'Restaurant menu', description: 'Dish list grouped by section with prices and dietary tags.' },
    ar: { label: 'قائمة المطعم', description: 'قائمة أطباق مجمّعة حسب القسم مع الأسعار ووسوم الحمية.' },
  },
  events: {
    en: { label: 'Events / schedule', description: 'Event list or calendar cards with dates, venues and pricing.' },
    ar: { label: 'الفعاليات / الجدول', description: 'قائمة فعاليات أو بطاقات تقويم مع التواريخ والأماكن والأسعار.' },
  },
  team: {
    en: { label: 'Team / profiles', description: 'People profiles with photos, roles, bios and social links.' },
    ar: { label: 'الفريق / الملفات', description: 'ملفات الأشخاص مع الصور والأدوار والنبذة وروابط التواصل.' },
  },
  testimonials: {
    en: { label: 'Testimonials', description: 'Customer quotes in a grid, slider or featured spotlight layout.' },
    ar: { label: 'الشهادات', description: 'آراء العملاء في شبكة أو شريط أو تصميم مميّز.' },
  },
  logos: {
    en: { label: 'Logo cloud', description: 'Client or partner logos as a static grid or infinite marquee.' },
    ar: { label: 'شعارات العملاء', description: 'شعارات العملاء أو الشركاء في شبكة ثابتة أو شريط متحرك.' },
  },
  socialFollow: {
    en: { label: 'Social follow', description: 'Social channel cards with follower counts.' },
    ar: { label: 'المتابعة الاجتماعية', description: 'بطاقات قنوات التواصل مع عدد المتابعين.' },
  },
  ctaBand: {
    en: { label: 'CTA band', description: 'Full-width conversion band with headline, dual CTAs and avatar proof.' },
    ar: { label: 'شريط الدعوة', description: 'شريط تحويل كامل العرض مع عنوان وزرّين ودليل بالصور.' },
  },
  pricing: {
    en: { label: 'Pricing table', description: 'Tiered pricing plans with feature lists, badges and CTAs.' },
    ar: { label: 'جدول الأسعار', description: 'خطط أسعار متدرجة مع قوائم الميزات والشارات وأزرار الإجراء.' },
  },
  accordion: {
    en: { label: 'Accordion / FAQ', description: 'Expandable Q&A list, optionally bound to the FAQ collection.' },
    ar: { label: 'الأكورديون / الأسئلة', description: 'قائمة أسئلة قابلة للتوسيع، مع إمكانية ربطها بمجموعة الأسئلة.' },
  },
  contact: {
    en: { label: 'Contact & form', description: 'Contact details with a validated enquiry form and map.' },
    ar: { label: 'التواصل والنموذج', description: 'بيانات التواصل مع نموذج استفسار موثّق وخريطة.' },
  },
  newsletter: {
    en: { label: 'Newsletter signup', description: 'Email capture band with inline form, benefits and social proof.' },
    ar: { label: 'النشرة البريدية', description: 'شريط جمع البريد مع نموذج مدمج ومزايا ودليل اجتماعي.' },
  },
  ctaBanner: {
    en: { label: 'CTA banner (compact)', description: 'Compact inline call-to-action strip with one button.' },
    ar: { label: 'لافتة دعوة (مضغوطة)', description: 'شريط دعوة مدمج ومضغوط مع زر واحد.' },
  },
  spacer: {
    en: { label: 'Spacer / divider', description: 'Whitespace or hairline divider between sections.' },
    ar: { label: 'مسافة / فاصل', description: 'مسافة بيضاء أو فاصل رفيع بين الأقسام.' },
  },
  mapLocations: {
    en: { label: 'Locations map', description: 'Branch list beside an embedded map, bound to the locations collection.' },
    ar: { label: 'خريطة الفروع', description: 'قائمة فروع بجانب خريطة مدمجة، مرتبطة بمجموعة المواقع.' },
  },
  footer: {
    en: { label: 'Site footer', description: 'Multi-column footer with brand, link groups, newsletter and socials.' },
    ar: { label: 'تذييل الموقع', description: 'تذييل متعدد الأعمدة مع العلامة ومجموعات الروابط والنشرة والتواصل.' },
  },
}

export const blockLabel = (def: Pick<BlockDefinition, 'type' | 'label'> | undefined, lang: Lang): string => {
  if (!def) return ''
  return BLOCK_COPY[def.type]?.[lang]?.label ?? def.label
}

export const blockDescription = (
  def: Pick<BlockDefinition, 'type' | 'description'> | undefined,
  lang: Lang,
): string => {
  if (!def) return ''
  return BLOCK_COPY[def.type]?.[lang]?.description ?? def.description
}

/**
 * Blocks persist a `label` when created. Older sites stored the English
 * default, so a stored label equal to the definition default is treated as
 * unrenamed and re-localised instead of shown verbatim.
 */
export const displayBlockLabel = (
  block: { type: string; label?: string },
  def: Pick<BlockDefinition, 'type' | 'label'> | undefined,
  lang: Lang,
): string => {
  const custom = block.label?.trim()
  if (custom && custom !== def?.label) return custom
  return blockLabel(def, lang) || block.type
}
