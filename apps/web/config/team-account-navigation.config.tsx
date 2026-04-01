import { Settings, Users } from 'lucide-react';

import { NavigationConfigSchema } from '@aloha/ui/navigation-schema';

const iconClasses = 'w-4';

const getRoutes = (account: string) => [
  {
    label: 'Settings',
    collapsible: false,
    children: [
      {
        label: 'Settings',
        path: `/home/${account}/settings`,
        Icon: <Settings className={iconClasses} />,
      },
      {
        label: 'Members',
        path: `/home/${account}/members`,
        Icon: <Users className={iconClasses} />,
      },
    ],
  },
];

export function getTeamAccountSidebarConfig(account: string) {
  return NavigationConfigSchema.parse({
    routes: getRoutes(account),
    style: 'sidebar',
  });
}
