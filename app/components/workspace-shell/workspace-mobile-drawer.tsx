import { useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { Button } from '@aloha/ui/button';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

import { AlohaLogoSquare } from './aloha-logo-square';

interface WorkspaceMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  account: string;
  navigation: { modules: AppNavModule[]; subModules: AppNavSubModule[] };
  hamburgerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function WorkspaceMobileDrawer({
  open,
  onClose,
  account,
  navigation,
  hamburgerRef,
}: WorkspaceMobileDrawerProps) {
  const firstNavRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);

  // Escape key closes drawer — justified useEffect (global key binding, per CLAUDE.md rule).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus management — justified useEffect (post-mount DOM focus, per CLAUDE.md rule).
  // Track previous open state so focus return only fires on open→closed transitions
  // (prevents focusing a hidden hamburger on initial mount at md+).
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const id = requestAnimationFrame(() => {
        const first =
          firstNavRef.current?.querySelector<HTMLElement>('a, button');
        first?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      hamburgerRef?.current?.focus();
    }
  }, [open, hamburgerRef]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={onClose}
            aria-hidden="true"
            data-test="workspace-mobile-drawer-backdrop"
          />
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col shadow-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            data-test="workspace-mobile-drawer"
          >
            <div className="border-border flex h-14 shrink-0 items-center justify-between border-b px-3">
              <div className="flex items-center gap-2">
                <AlohaLogoSquare size="sm" />
                <span className="text-foreground text-base font-semibold">
                  Aloha
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close navigation menu"
                data-test="workspace-mobile-drawer-close"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div
              ref={firstNavRef}
              className="mt-1 flex-1 overflow-y-auto px-3 py-2"
            >
              <ModuleSidebarNavigation
                account={account}
                modules={navigation.modules}
                subModules={navigation.subModules}
                onNavigate={onClose}
                forceExpanded
              />
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
