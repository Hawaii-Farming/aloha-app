import {
  BadgeDollarSign,
  Beaker,
  BedDouble,
  BookOpen,
  Bug,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  CircleCheckBig,
  CircleDollarSign,
  CircleHelp,
  ClipboardList,
  ClipboardPen,
  Clock,
  Contact,
  CreditCard,
  DollarSign,
  Droplet,
  Droplets,
  Factory,
  FileSpreadsheet,
  FileText,
  Flag,
  Fuel,
  Gauge,
  GraduationCap,
  Grid3x3,
  Hammer,
  Handshake,
  Home,
  Leaf,
  ListChecks,
  ListOrdered,
  MapPin,
  MessageSquare,
  Notebook,
  Package,
  PackageOpen,
  Percent,
  Receipt,
  Scale,
  Scissors,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SprayCan,
  Sprout,
  Store,
  Tags,
  Thermometer,
  Timer,
  Truck,
  UserCheck,
  Users,
  Variable,
  Vegan,
  Wallet,
  Warehouse,
  Wrench,
} from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

const moduleIcons: Record<string, IconComponent> = {
  operations: Factory,
  grow: Leaf,
  pack: Package,
  food_safety: ShieldCheck,
  maintenance: Wrench,
  inventory: Warehouse,
  sales: ShoppingCart,
  human_resources: Users,
};

const subModuleIcons: Record<string, IconComponent> = {
  // Operations
  action_items: CircleCheckBig,
  sites: MapPin,
  flags: Flag,
  variables: Variable,
  sops: BookOpen,
  faq: CircleHelp,

  // Grow
  cuke_calendar: CalendarDays,
  cuke_seeding: Sprout,
  cuke_sched: CalendarCheck,
  cuke_harvest: Scissors,
  lettuce_seeding: Vegan,
  lettuce_yield: Scale,
  fertilizer_sched: Droplets,
  scouting: Search,
  spraying_sched: SprayCan,
  chemistry: Beaker,

  // Pack
  cuke_pack: PackageOpen,
  lettuce_p_h: Thermometer,
  lettuce_pack: ListChecks,
  shelf_life: Timer,
  moisture: Droplet,

  // Food Safety
  fsafe_logs: ClipboardList,
  corrective_actions: ClipboardPen,
  pest_activity: Bug,
  staff_training: GraduationCap,
  visitors_log: Notebook,
  customer_communication: MessageSquare,

  // Maintenance
  maint_request: Hammer,
  fuel_log: Fuel,
  maint_inventory: ListOrdered,
  house_inspection: Home,

  // Inventory
  wto: Truck,
  orders: Receipt,
  budget: DollarSign,
  procurement: CreditCard,

  // Sales
  po_s: FileText,
  palletization: Grid3x3,
  price_product_spec: Tags,
  customers: Store,
  crm: Handshake,
  markup: Percent,
  ext_prices: CircleDollarSign,
  price_grid: FileSpreadsheet,

  // Human Resources
  register: Contact,
  scheduler: CalendarClock,
  time_off: CalendarOff,
  hours_comp: Clock,
  payroll_comp: BadgeDollarSign,
  payroll_comp_manager: Wallet,
  payroll_data: Gauge,
  housing: BedDouble,
  employee_review: UserCheck,
};

export function getModuleIcon(moduleSlug: string): IconComponent {
  return moduleIcons[moduleSlug] ?? Settings;
}

export function getSubModuleIcon(subModuleSlug: string): IconComponent {
  return subModuleIcons[subModuleSlug] ?? Settings;
}
