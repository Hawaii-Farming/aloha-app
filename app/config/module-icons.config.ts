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

// Keys are sys_module.id / sys_sub_module.id values — Proper Case display
// names that double as URL segments. The id flows straight from the URL
// param into these lookups.
const moduleIcons: Record<string, IconComponent> = {
  Operations: Factory,
  Grow: Leaf,
  Pack: Package,
  'Food Safety': ShieldCheck,
  Maintenance: Wrench,
  Inventory: Warehouse,
  Sales: ShoppingCart,
  'Human Resources': Users,
};

const subModuleIcons: Record<string, IconComponent> = {
  // Operations
  'Action Items': CircleCheckBig,
  Sites: MapPin,
  Flags: Flag,
  Variables: Variable,
  Sops: BookOpen,
  Faq: CircleHelp,

  // Grow
  'Cuke Calendar': CalendarDays,
  'Cuke Seeding': Sprout,
  'Cuke Sched': CalendarCheck,
  'Cuke Harvest': Scissors,
  'Lettuce Seeding': Vegan,
  'Lettuce Yield': Scale,
  'Fertilizer Sched': Droplets,
  Scouting: Search,
  'Spraying Sched': SprayCan,
  Chemistry: Beaker,

  // Pack
  'Cuke Pack': PackageOpen,
  'Lettuce P&H': Thermometer,
  'Lettuce Pack': ListChecks,
  'Shelf Life': Timer,
  Moisture: Droplet,

  // Food Safety
  'Fsafe Logs': ClipboardList,
  'Corrective Actions': ClipboardPen,
  'Pest Activity': Bug,
  'Staff Training': GraduationCap,
  'Visitors Log': Notebook,
  'Customer Communication': MessageSquare,

  // Maintenance
  'Maint Request': Hammer,
  'Fuel Log': Fuel,
  'Maint Inventory': ListOrdered,
  'House Inspection': Home,

  // Inventory
  Wto: Truck,
  Orders: Receipt,
  Budget: DollarSign,
  Procurement: CreditCard,

  // Sales
  "Po'S": FileText,
  Palletization: Grid3x3,
  'Price & Product Spec': Tags,
  Customers: Store,
  Crm: Handshake,
  Markup: Percent,
  'Ext Prices': CircleDollarSign,
  'Price Grid': FileSpreadsheet,

  // Human Resources
  Register: Contact,
  Scheduler: CalendarClock,
  'Time Off': CalendarOff,
  'Hours Comp': Clock,
  'Payroll Comp': BadgeDollarSign,
  'Payroll Comp Manager': Wallet,
  'Payroll Data': Gauge,
  Housing: BedDouble,
  'Employee Review': UserCheck,
};

export function getModuleIcon(moduleId: string): IconComponent {
  return moduleIcons[moduleId] ?? Settings;
}

export function getSubModuleIcon(subModuleId: string): IconComponent {
  return subModuleIcons[subModuleId] ?? Settings;
}
