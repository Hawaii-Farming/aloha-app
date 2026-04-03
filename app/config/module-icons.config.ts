import {
  AlertTriangle,
  Box,
  Building2,
  CalendarOff,
  CheckSquare,
  Clipboard,
  ClipboardList,
  DollarSign,
  FlaskConical,
  Leaf,
  PackageSearch,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  UserCircle,
  Users,
  Warehouse,
} from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

const moduleIcons: Record<string, IconComponent> = {
  human_resources: Users,
  inventory: Box,
  operations: Clipboard,
  growing: Leaf,
  food_safety: FlaskConical,
};

const subModuleIcons: Record<string, IconComponent> = {
  employees: UserCircle,
  departments: Building2,
  time_off: CalendarOff,
  payroll: DollarSign,
  products: ShoppingCart,
  warehouses: Warehouse,
  stock_counts: PackageSearch,
  task_tracking: ClipboardList,
  checklists: CheckSquare,
  seed_batches: Sprout,
  harvests: Scissors,
  inspections: ShieldCheck,
  incidents: AlertTriangle,
};

export function getModuleIcon(moduleSlug: string): IconComponent {
  return moduleIcons[moduleSlug] ?? Settings;
}

export function getSubModuleIcon(subModuleSlug: string): IconComponent {
  return subModuleIcons[subModuleSlug] ?? Settings;
}
