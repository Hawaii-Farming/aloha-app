import { createContext, use, useMemo, useState } from 'react';

import { useLocation, useParams } from 'react-router';

import type { AiPageContext } from '~/lib/ai/ai-context';

interface AiChatContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  context: AiPageContext;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

function derivePageType(
  pathname: string,
  recordId?: string,
): AiPageContext['pageType'] {
  if (recordId && pathname.endsWith('/edit')) return 'edit';
  if (recordId) return 'detail';
  if (pathname.endsWith('/create')) return 'create';
  return 'list';
}

export function AiChatProvider(
  props: React.PropsWithChildren<{ orgName: string }>,
) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const location = useLocation();

  const context = useMemo<AiPageContext>(() => {
    const account = params.account ?? '';
    const module = params.module;
    const subModule = params.subModule;
    const recordId = params.recordId;

    const pageType =
      module || subModule
        ? derivePageType(location.pathname, recordId)
        : 'dashboard';

    return {
      orgId: account,
      orgName: props.orgName,
      module,
      subModule,
      recordId,
      pageType,
    };
  }, [
    params.account,
    params.module,
    params.subModule,
    params.recordId,
    props.orgName,
    location.pathname,
  ]);

  const value = useMemo(
    () => ({ open, setOpen, context }),
    [open, setOpen, context],
  );

  return <AiChatContext value={value}>{props.children}</AiChatContext>;
}

export function useAiChat() {
  const value = use(AiChatContext);

  if (!value) {
    throw new Error('useAiChat must be used within an AiChatProvider');
  }

  return value;
}
