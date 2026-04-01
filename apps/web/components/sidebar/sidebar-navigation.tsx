import { z } from 'zod';

import { NavigationConfigSchema } from '@aloha/ui/navigation-schema';
import { SidebarNavigation } from '@aloha/ui/shadcn-sidebar';

export function WorkspaceSidebarNavigation({
  config,
}: React.PropsWithChildren<{
  config: z.infer<typeof NavigationConfigSchema>;
}>) {
  return <SidebarNavigation config={config} />;
}
