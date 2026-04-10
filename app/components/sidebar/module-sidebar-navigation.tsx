import { createElement, useState } from 'react';

import { Link, useLocation } from 'react-router';

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
  onNavigate?: () => void;
  forceExpanded?: boolean;
}

export function ModuleSidebarNavigation(props: ModuleSidebarNavigationProps) {
  const {
    account,
    modules,
    subModules,
    onNavigate,
    forceExpanded = false,
  } = props;
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
            {!forceExpanded && (
              <div className="hidden group-data-[collapsible=icon]:block">
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <Collapsible
                        open={isOpen}
                        onOpenChange={() => toggleModule(mod.module_slug)}
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            tooltip={mod.display_name}
                            isActive={isModuleActive}
                            className={cn(
                              isModuleActive
                                ? 'rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                                : 'text-foreground hover:bg-muted rounded-xl bg-transparent',
                            )}
                          >
                            <Link
                              to={modulePath}
                              onClick={() => {
                                if (!isOpen) toggleModule(mod.module_slug);
                                onNavigate?.();
                              }}
                              aria-label={mod.display_name}
                            >
                              {createElement(IconComponent, {
                                className: 'h-4 w-4 shrink-0',
                              })}
                            </Link>
                          </SidebarMenuButton>
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
                                    isActive
                                      ? 'rounded-lg bg-green-50 font-medium text-green-700'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg bg-transparent',
                                  )}
                                >
                                  <Link
                                    to={subModulePath}
                                    onClick={() => onNavigate?.()}
                                  >
                                    {createElement(SubModuleIcon, {
                                      className: 'h-4 w-4 shrink-0',
                                    })}
                                  </Link>
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
            )}

            {/* Expanded mode — hidden when sidebar is icon mode */}
            <div
              className={cn(
                !forceExpanded && 'group-data-[collapsible=icon]:hidden',
              )}
            >
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleModule(mod.module_slug)}
              >
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className={cn(
                        'cursor-pointer gap-2 select-none',
                        isModuleActive
                          ? 'rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                          : 'text-foreground hover:bg-muted rounded-xl bg-transparent',
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
                      <div className="ml-5 border-l-2 border-green-200 pl-3">
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
                                    isActive
                                      ? 'rounded-lg bg-green-50 font-medium text-green-700'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg bg-transparent',
                                  )}
                                >
                                  <Link
                                    to={subModulePath}
                                    onClick={() => onNavigate?.()}
                                  >
                                    {createElement(SubModuleIcon, {
                                      className: 'h-4 w-4 shrink-0',
                                    })}
                                    <span className="truncate capitalize">
                                      {sm.display_name}
                                    </span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </div>
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
