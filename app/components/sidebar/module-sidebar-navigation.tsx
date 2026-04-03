import { createElement } from 'react';

import { useLocation } from 'react-router';

import { ChevronRight } from 'lucide-react';

import { cn } from '@aloha/ui/utils';

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
  useSidebar,
} from '@aloha/ui/shadcn-sidebar';

import {
  getModuleIcon,
  getSubModuleIcon,
} from '~/config/module-icons.config';
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
  const { open } = useSidebar();

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
        const children = (subModulesByModule.get(mod.module_slug) ?? []).sort(
          (a, b) => a.display_order - b.display_order,
        );
        const modulePath = `/home/${account}/${mod.module_slug}`;
        const isModuleActive = currentPath.startsWith(modulePath);
        const IconComponent = getModuleIcon(mod.module_slug);

        if (!open) {
          return (
            <div key={mod.module_id}>
              {index > 0 && <SidebarSeparator className="mx-0" />}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip={mod.display_name}
                        className="pointer-events-none text-muted-foreground opacity-60"
                      >
                        {createElement(IconComponent, {
                          className: 'h-4 w-4 shrink-0',
                        })}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {children.map((sm) => {
                      const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
                      const isActive =
                        currentPath === subModulePath ||
                        currentPath.startsWith(subModulePath + '/');
                      const SubModuleIcon = getSubModuleIcon(
                        sm.sub_module_slug,
                      );

                      return (
                        <SidebarMenuItem key={sm.sub_module_id}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={sm.display_name}
                            className={cn(
                              !isActive && 'text-muted-foreground',
                            )}
                          >
                            <a href={subModulePath}>
                              {createElement(SubModuleIcon, {
                                className: 'h-4 w-4 shrink-0',
                              })}
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          );
        }

        return (
          <div key={mod.module_id}>
            {index > 0 && <SidebarSeparator className="mx-0" />}
            <Collapsible
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger
                    className={cn(
                      'flex w-full items-center gap-2',
                      !isModuleActive && 'text-muted-foreground',
                    )}
                  >
                    {createElement(IconComponent, {
                      className: 'h-4 w-4 shrink-0',
                    })}
                    <span className="flex-1 truncate text-left uppercase">{mod.display_name}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {children.map((sm) => {
                        const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
                        const isActive =
                          currentPath === subModulePath ||
                          currentPath.startsWith(subModulePath + '/');
                        const SubModuleIcon = getSubModuleIcon(
                          sm.sub_module_slug,
                        );

                        return (
                          <SidebarMenuItem key={sm.sub_module_id}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              tooltip={sm.display_name}
                              className={cn(
                                !isActive && 'text-muted-foreground',
                              )}
                            >
                              <a href={subModulePath}>
                                {createElement(SubModuleIcon, {
                                  className: 'h-4 w-4 shrink-0',
                                })}
                                <span className="truncate capitalize">{sm.display_name}</span>
                              </a>
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
      <SidebarSeparator className="mx-0" />
    </>
  );
}
