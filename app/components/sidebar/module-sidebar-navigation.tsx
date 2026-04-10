// Phase 10 D-10: inline collapse affordance is OMITTED — navbar PanelLeft
// toggle is the single source of truth for sidebar collapse.
import { createElement, useMemo, useState } from 'react';

import { Link, useLocation } from 'react-router';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@aloha/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
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

  const subModulesByModule = useMemo(() => {
    const map = new Map<string, AppNavSubModule[]>();
    for (const sm of subModules) {
      const list = map.get(sm.module_slug) ?? [];
      list.push(sm);
      map.set(sm.module_slug, list);
    }
    return map;
  }, [subModules]);

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.display_order - b.display_order),
    [modules],
  );

  // User-driven open/close state. Auto-expand of the active module is
  // computed derivationally in `openModules` below — no useEffect,
  // no stale state when the route changes.
  const [userToggled, setUserToggled] = useState<Set<string>>(new Set());

  const openModules = useMemo(() => {
    const s = new Set(userToggled);
    const active = sortedModules.find((m) =>
      currentPath.startsWith(`/home/${account}/${m.module_slug}`),
    )?.module_slug;
    if (active) s.add(active);
    return s;
  }, [userToggled, sortedModules, currentPath, account]);

  function toggleModule(slug: string) {
    setUserToggled((prev) => {
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
        const isModuleActive =
          currentPath === modulePath ||
          currentPath.startsWith(`${modulePath}/`);
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
                                ? 'rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 dark:from-green-400 dark:to-emerald-500 dark:text-green-950'
                                : 'text-foreground hover:bg-muted rounded-xl bg-transparent',
                            )}
                          >
                            <Link
                              to={modulePath}
                              onClick={() => onNavigate?.()}
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
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem className="relative">
                        <SidebarMenuButton
                          asChild
                          isActive={isModuleActive}
                          className={cn(
                            'rounded-xl px-3 py-2 pr-9 uppercase',
                            isModuleActive
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:from-green-500 hover:to-emerald-600 hover:text-white dark:from-green-400 dark:to-emerald-500 dark:text-green-950'
                              : 'text-foreground hover:bg-muted bg-transparent',
                          )}
                        >
                          <Link to={modulePath} onClick={() => onNavigate?.()}>
                            {createElement(IconComponent, {
                              className: 'h-4 w-4 shrink-0',
                            })}
                            <span className="flex-1 truncate text-left">
                              {mod.display_name}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Toggle ${mod.display_name} sub-items`}
                            className={cn(
                              'absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md',
                              isModuleActive
                                ? 'text-white hover:bg-white/10 dark:text-green-950'
                                : 'text-muted-foreground hover:bg-muted',
                            )}
                          >
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
                          </button>
                        </CollapsibleTrigger>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      {/* PARITY-04: vertical separation + dark-mode rail */}
                      <div
                        data-sidebar="menu-sub"
                        className="mt-1 mb-1 ml-5 flex flex-col gap-1 border-l-2 border-green-200 pl-3 dark:border-green-900/60"
                      >
                        {children.map((sm, subIndex) => {
                          const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
                          const isActive =
                            currentPath === subModulePath ||
                            currentPath.startsWith(subModulePath + '/');
                          const SubModuleIcon = getSubModuleIcon(
                            sm.sub_module_slug,
                          );

                          return (
                            <SidebarMenuItem
                              key={sm.sub_module_id}
                              className={cn(subIndex === 0 && 'mt-1')}
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={sm.display_name}
                                className={cn(
                                  isActive
                                    ? 'rounded-lg bg-green-50 font-medium text-green-700 dark:bg-green-900/40 dark:text-green-200'
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
