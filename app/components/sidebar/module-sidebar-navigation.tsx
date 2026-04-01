import { createElement } from 'react';

import { useLocation } from 'react-router';

import { ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@aloha/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@aloha/ui/shadcn-sidebar';

import { getModuleIcon } from '~/config/module-icons.config';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

interface ModuleSidebarNavigationProps {
  account: string;
  modules: AppNavModule[];
  subModules: AppNavSubModule[];
}

export function ModuleSidebarNavigation(props: ModuleSidebarNavigationProps) {
  const { account, modules, subModules } = props;
  const location = useLocation();
  const currentPath = location.pathname;

  const subModulesByModule = new Map<string, AppNavSubModule[]>();

  for (const sm of subModules) {
    const list = subModulesByModule.get(sm.module_slug) ?? [];
    list.push(sm);
    subModulesByModule.set(sm.module_slug, list);
  }

  const sortedModules = [...modules].sort(
    (a, b) => a.display_order - b.display_order,
  );

  return (
    <>
      {sortedModules.map((mod, index) => {
        const children = subModulesByModule.get(mod.module_slug) ?? [];
        const modulePath = `/home/${account}/${mod.module_slug}`;
        const isModuleActive = currentPath.startsWith(modulePath);
        const IconComponent = getModuleIcon(mod.module_slug);

        return (
          <div key={mod.module_id}>
            {index > 0 && <SidebarSeparator />}
            <Collapsible
              defaultOpen={isModuleActive}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2">
                    {createElement(IconComponent, {
                      className: 'h-4 w-4',
                    })}
                    <span className="flex-1 text-left">{mod.display_name}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {children
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((sm) => {
                          const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
                          const isActive =
                            currentPath === subModulePath ||
                            currentPath.startsWith(subModulePath + '/');

                          return (
                            <SidebarMenuItem key={sm.sub_module_id}>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <a href={subModulePath}>{sm.display_name}</a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </div>
        );
      })}
    </>
  );
}
