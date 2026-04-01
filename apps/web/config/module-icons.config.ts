import {
  Box,
  Clipboard,
  FlaskConical,
  Leaf,
  Settings,
  Users,
} from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

const moduleIcons: Record<string, IconComponent> = {
  human_resources: Users,
  inventory: Box,
  operations: Clipboard,
  growing: Leaf,
  food_safety: FlaskConical,
};

export function getModuleIcon(moduleSlug: string): IconComponent {
  return moduleIcons[moduleSlug] ?? Settings;
}
