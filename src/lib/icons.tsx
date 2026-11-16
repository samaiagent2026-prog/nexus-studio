import * as Lucide from 'lucide-react'

type IconComponent = React.ComponentType<any>

const FALLBACK = Lucide.Square

const registry = Lucide as unknown as Record<string, IconComponent>

/** Resolve a lucide icon by PascalCase name, with a safe fallback. */
export function resolveIcon(name?: string): IconComponent {
  if (!name) return FALLBACK
  const key = name.trim()
  return registry[key] ?? registry[key.charAt(0).toUpperCase() + key.slice(1)] ?? FALLBACK
}

/** Curated palette used by the icon picker — grouped for fast scanning. */
export const ICON_GROUPS: { group: string; icons: string[] }[] = [
  {
    group: 'Business',
    icons: ['Briefcase', 'Building2', 'Store', 'Factory', 'Warehouse', 'Handshake', 'Megaphone', 'Target', 'TrendingUp', 'BarChart3', 'PieChart', 'LineChart', 'Wallet', 'CreditCard', 'DollarSign', 'Receipt', 'Percent', 'BadgePercent', 'Trophy', 'Medal', 'Crown', 'Award', 'Gauge', 'Rocket'],
  },
  {
    group: 'People & health',
    icons: ['Users', 'User', 'Heart', 'HeartPulse', 'Stethoscope', 'Pill', 'Syringe', 'Microscope', 'Hospital', 'Ambulance', 'Activity', 'Accessibility', 'Baby', 'Dog', 'GraduationCap', 'Dumbbell'],
  },
  {
    group: 'Property & places',
    icons: ['Home', 'Building2', 'Bed', 'Bath', 'Wifi', 'ParkingCircle', 'MapPin', 'Map', 'Compass', 'Navigation', 'Route', 'Mountain', 'Trees', 'Waves', 'Anchor', 'Sun', 'Leaf', 'Droplets', 'Wind', 'Flame'],
  },
  {
    group: 'Commerce',
    icons: ['ShoppingCart', 'ShoppingBag', 'ShoppingBasket', 'Package', 'PackageCheck', 'Boxes', 'Truck', 'Tag', 'Ticket', 'Gift', 'Percent', 'Store', 'Boxes', 'ClipboardList', 'Receipt', 'Wallet'],
  },
  {
    group: 'Food & leisure',
    icons: ['UtensilsCrossed', 'Pizza', 'Coffee', 'Cake', 'IceCream', 'Salad', 'Soup', 'Sandwich', 'Beef', 'Fish', 'Egg', 'Wine', 'Beer', 'Martini', 'CupSoda', 'GlassWater'],
  },
  {
    group: 'Travel',
    icons: ['Car', 'Plane', 'Train', 'Bus', 'Bike', 'Ship', 'Sailboat', 'Fuel', 'Map', 'Compass', 'Luggage', 'Hotel', 'Bed', 'Sun', 'Camera'],
  },
  {
    group: 'Tech',
    icons: ['Cpu', 'Code', 'Terminal', 'Database', 'Cloud', 'Server', 'Network', 'Wifi', 'Smartphone', 'Laptop', 'MonitorSmartphone', 'Tablet', 'Watch', 'Bot', 'Brain', 'CircuitBoard', 'Plug', 'Battery'],
  },
  {
    group: 'Interface',
    icons: ['Search', 'Settings', 'Filter', 'SlidersHorizontal', 'Menu', 'Star', 'Heart', 'Bookmark', 'Flag', 'Bell', 'Mail', 'Phone', 'MessageCircle', 'Send', 'Share2', 'Quote', 'Play', 'Download', 'ExternalLink', 'Check', 'CheckCircle2', 'Plus', 'Minus', 'ArrowRight', 'ChevronRight', 'Info', 'HelpCircle', 'Sparkles', 'Zap', 'Shield', 'Lock', 'KeyRound', 'Fingerprint', 'Calendar', 'CalendarCheck', 'Clock', 'Timer', 'Repeat', 'RefreshCw', 'Layers', 'Layout', 'Grid2x2', 'List', 'Columns3', 'Maximize2', 'Move', 'Image', 'Camera', 'Film', 'Music', 'Mic', 'BookOpen', 'FileText', 'Newspaper', 'Rss'],
  },
  {
    group: 'Social',
    icons: ['Facebook', 'Instagram', 'Twitter', 'Linkedin', 'Youtube', 'Github', 'Dribbble', 'Figma', 'Twitch', 'Slack', 'Send', 'Share2'],
  },
]

export const ALL_ICON_NAMES = Array.from(new Set(ICON_GROUPS.flatMap((g) => g.icons)))

/**
 * JSX-friendly icon. Renders a Lucide icon by name so call sites can use
 * <Ic n="Star" size={14} /> instead of resolving a component first.
 */
export function Ic({ n, ...rest }: { n: string } & Record<string, any>) {
  const Comp = resolveIcon(n)
  return <Comp {...rest} />
}
