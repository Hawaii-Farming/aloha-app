// Phase 10 D-10: inline collapse affordance is OMITTED — navbar PanelLeft
// toggle is the single source of truth for sidebar collapse.
//
// Quick 260410-sl6: module rows + sub-items restyled to match the
// aloha-design prototype (Sidebar.tsx). Labels are sentence case at
// 15px/medium, icons at 18px, chevron rendered inline at end of row,
// no separators between module rows, sub-items are text-only inside
// a green-200 rail.
import { createElement, useMemo, useState } from 'react';

import { Link, useLocation } from 'react-router';

import { ChevronDown } from 'lucide-react';

import { Collapsible, CollapsibleContent } from '@aloha/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import { getModuleIcon } from '~/config/module-icons.config';
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
      {sortedModules.map((mod) => {
        const children = (subModulesByModule.get(mod.module_slug) ?? []).sort(
          (a, b) => a.display_order - b.display_order,
        );
        const modulePath = `/home/${account}/${mod.module_slug}`;
        const isRouteActive =
          currentPath === modulePath ||
          currentPath.startsWith(`${modulePath}/`);
        const IconComponent = getModuleIcon(mod.module_slug);
        const isOpen = openModules.has(mod.module_slug);
        const hasChildren = children.length > 0;
        // Prototype parity: the module row shows the green gradient
        // whenever its group is open (expanded), not only when a child
        // route is active. Active URL still forces open via openModules.
        const isModuleActive = isOpen || isRouteActive;

        return (
          <div key={mod.module_id}>
            {/* Collapsed (icon-only) mode — just the module icon.
             * Prototype parity: submenus are NEVER rendered when the
             * sidebar is collapsed. Clicking the icon navigates to the
             * module root; tooltip shows the full label on hover. */}
            {!forceExpanded && (
              <div className="hidden items-center justify-center px-2 py-1 group-data-[collapsible=icon]:flex">
                <Link
                  to={modulePath}
                  onClick={() => onNavigate?.()}
                  aria-label={mod.display_name}
                  title={mod.display_name}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                    isRouteActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 dark:from-green-400 dark:to-emerald-500 dark:text-green-950'
                      : 'text-foreground hover:bg-muted bg-transparent',
                  )}
                >
                  {createElement(IconComponent, {
                    className: 'h-[18px] w-[18px] shrink-0',
                  })}
                </Link>
              </div>
            )}

            {/* Expanded mode — hidden when sidebar is icon mode */}
            <div
              className={cn(
                !forceExpanded && 'group-data-[collapsible=icon]:hidden',
              )}
            >
              <Collapsible open={isOpen}>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            'gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium',
                            isModuleActive
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:from-green-500 hover:to-emerald-600 hover:text-white dark:from-green-400 dark:to-emerald-500 dark:text-green-950'
                              : 'text-foreground hover:bg-muted bg-transparent',
                          )}
                        >
                          <Link
                            to={modulePath}
                            onClick={() => {
                              onNavigate?.();
                              if (hasChildren) {
                                toggleModule(mod.module_slug);
                              }
                            }}
                          >
                            {createElement(IconComponent, {
                              className: 'h-[18px] w-[18px] shrink-0',
                            })}
                            <span className="flex-1 truncate text-left">
                              {mod.display_name}
                            </span>
                            {hasChildren && (
                              <ChevronDown
                                className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                                  isOpen && 'rotate-180',
                                  isModuleActive
                                    ? 'text-white/70 dark:text-green-950/70'
                                    : 'text-muted-foreground',
                                )}
                              />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                  <CollapsibleContent className="data-[state=closed]:animate-[collapsible-up_0.22s_cubic-bezier(0.4,0,0.2,1)] data-[state=open]:animate-[collapsible-down_0.32s_cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden">
                    <SidebarGroupContent>
                      {/* PARITY-04: vertical separation + dark-mode rail.
                       * Sub-items are plain anchors (not <li>) to avoid
                       * native list markers inside the green rail. */}
                      <div
                        data-sidebar="menu-sub"
                        className="mt-1 mb-1 ml-5 flex list-none flex-col gap-0.5 border-l-2 border-green-200 pl-3 dark:border-green-900/60"
                      >
                        {children.map((sm, subIndex) => {
                          const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
                          const isActive =
                            currentPath === subModulePath ||
                            currentPath.startsWith(subModulePath + '/');

                          return (
                            <Link
                              key={sm.sub_module_id}
                              to={subModulePath}
                              onClick={() => onNavigate?.()}
                              title={sm.display_name}
                              className={cn(
                                'block rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                                subIndex === 0 && 'mt-1',
                                isActive
                                  ? 'bg-green-50 font-medium text-green-700 dark:bg-green-900/40 dark:text-green-200'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent',
                              )}
                            >
                              <span className="block truncate">
                                {sm.display_name}
                              </span>
                            </Link>
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
    </>
  );
}
