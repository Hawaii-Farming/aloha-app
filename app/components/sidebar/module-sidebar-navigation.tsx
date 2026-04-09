import { createElement, useState } from 'react';

import { useLocation } from 'react-router';

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
import { cn } from '@aloha/ui/utils';

import { getModuleIcon, getSubModuleIcon } from '~/config/module-icons.config';
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

  // Auto-expand the active module
  const activeModuleSlug = sortedModules.find((mod) =>
    currentPath.startsWith(`/home/${account}/${mod.module_slug}`),
  )?.module_slug;

  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(activeModuleSlug ? [activeModuleSlug] : []),
  );

  function toggleModule(slug: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });
  }

  return (
    <>
      {sortedModules.map((mod, index) => {
        const children = (subModulesByModule.get(mod.module_slug) ?? []).sort(
          (a, b) => a.display_order - b.display_order,
        );
        const modulePath = `/home/${account}/${mod.module_slug}`;
        const isModuleActive = currentPath.startsWith(modulePath);
        const IconComponent = getModuleIcon(mod.module_slug);
        const isOpen = openModules.has(mod.module_slug);

        return (
          <div key={mod.module_id}>
            {index > 0 && <SidebarSeparator className="mx-0" />}

            {/* Collapsed mode — module icon with popover sub-menu */}
            <div className="hidden group-data-[collapsible=icon]:block">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleModule(mod.module_slug)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={mod.display_name}
                            isActive={isModuleActive}
                            className={cn(
                              !isModuleActive && 'text-muted-foreground',
                            )}
                          >
                            {createElement(IconComponent, {
                              className: 'h-4 w-4 shrink-0',
                            })}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {children.map((sm) => {
                            const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
                            const isActive =
                              currentPath === subModulePath ||
                              currentPath.startsWith(subModulePath + '/');
                            const SubModuleIcon = getSubModuleIcon(
                              sm.sub_module_slug,
                            );

                            return (
                              <SidebarMenuButton
                                key={sm.sub_module_id}
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
                            );
                          })}
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>

            {/* Expanded mode — hidden when sidebar is icon mode */}
            <div className="group-data-[collapsible=icon]:hidden">
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleModule(mod.module_slug)}
              >
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className={cn(
                        'cursor-pointer gap-2 select-none',
                        !isModuleActive && 'text-muted-foreground',
                      )}
                    >
                      {createElement(IconComponent, {
                        className: 'h-4 w-4 shrink-0',
                      })}
                      <span className="flex-1 truncate text-left uppercase">
                        {mod.display_name}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
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
                                  <span className="truncate capitalize">
                                    {sm.display_name}
                                  </span>
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
          </div>
        );
      })}
      <SidebarSeparator className="mx-0" />
    </>
  );
}
