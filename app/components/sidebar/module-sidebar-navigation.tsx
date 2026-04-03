import { createElement } from 'react';

import { useLocation } from 'react-router';

import { ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@aloha/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
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

        // Icon mode (sidebar collapsed): show a dropdown per module so submodules
        // are reachable via the module icon button.
        if (!open) {
          const isAnySubModuleActive = children.some((sm) => {
            const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
            return (
              currentPath === subModulePath ||
              currentPath.startsWith(subModulePath + '/')
            );
          });

          return (
            <div key={mod.module_id}>
              {index > 0 && <SidebarSeparator />}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            isActive={isModuleActive || isAnySubModuleActive}
                            tooltip={mod.display_name}
                          >
                            {createElement(IconComponent, {
                              className: 'h-4 w-4',
                            })}
                            <span className="capitalize">{mod.display_name}</span>
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          {children.map((sm) => {
                            const subModulePath = `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`;
                            const isActive =
                              currentPath === subModulePath ||
                              currentPath.startsWith(subModulePath + '/');
                            const SubModuleIcon = getSubModuleIcon(
                              sm.sub_module_slug,
                            );

                            return (
                              <DropdownMenuItem key={sm.sub_module_id} asChild>
                                <a
                                  href={subModulePath}
                                  data-active={isActive}
                                  className="flex items-center gap-2"
                                >
                                  {createElement(SubModuleIcon, {
                                    className: 'h-4 w-4',
                                  })}
                                  <span className="capitalize">{sm.display_name}</span>
                                </a>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          );
        }

        // Expanded mode: collapsible accordion with submodule items.
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
                    <span className="flex-1 text-left capitalize">{mod.display_name}</span>
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
                            >
                              <a href={subModulePath}>
                                {createElement(SubModuleIcon, {
                                  className: 'h-4 w-4',
                                })}
                                <span className="capitalize">{sm.display_name}</span>
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
    </>
  );
}
