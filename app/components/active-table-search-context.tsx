import {
  type ReactNode,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface ActiveTable {
  slug: string;
  displayName: string;
}

interface ActiveTableSearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
  activeTable: ActiveTable | null;
  registerActiveTable: (slug: string, displayName: string) => void;
  unregisterActiveTable: (slug: string) => void;
}

const ActiveTableSearchContext =
  createContext<ActiveTableSearchContextValue | null>(null);

export function ActiveTableSearchProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<{
    query: string;
    activeTable: ActiveTable | null;
  }>({ query: '', activeTable: null });

  const setQuery = useCallback((q: string) => {
    setState((prev) => (prev.query === q ? prev : { ...prev, query: q }));
  }, []);

  const clearQuery = useCallback(() => {
    setState((prev) => (prev.query === '' ? prev : { ...prev, query: '' }));
  }, []);

  const registerActiveTable = useCallback(
    (slug: string, displayName: string) => {
      setState((prev) => {
        if (
          prev.activeTable?.slug === slug &&
          prev.activeTable.displayName === displayName
        ) {
          return prev;
        }
        // Route change to a different active table — clear any stale query too.
        return {
          query: prev.activeTable?.slug === slug ? prev.query : '',
          activeTable: { slug, displayName },
        };
      });
    },
    [],
  );

  const unregisterActiveTable = useCallback((slug: string) => {
    setState((prev) => {
      if (prev.activeTable?.slug !== slug) return prev;
      return { query: '', activeTable: null };
    });
  }, []);

  const value = useMemo<ActiveTableSearchContextValue>(
    () => ({
      query: state.query,
      setQuery,
      clearQuery,
      activeTable: state.activeTable,
      registerActiveTable,
      unregisterActiveTable,
    }),
    [
      state.query,
      state.activeTable,
      setQuery,
      clearQuery,
      registerActiveTable,
      unregisterActiveTable,
    ],
  );

  return (
    <ActiveTableSearchContext.Provider value={value}>
      {children}
    </ActiveTableSearchContext.Provider>
  );
}

export function useActiveTableSearch(): ActiveTableSearchContextValue {
  const ctx = use(ActiveTableSearchContext);
  if (!ctx) {
    throw new Error(
      'useActiveTableSearch must be used inside <ActiveTableSearchProvider>',
    );
  }
  return ctx;
}

/**
 * Registers the calling list view as the currently-active searchable table.
 * Clears its own registration on unmount (or when slug/displayName changes).
 *
 * useEffect is justified here: mount/unmount side effect with cleanup — no
 * alternative (route-driven registration has no event to observe).
 */
export function useRegisterActiveTable(slug: string, displayName: string) {
  const { registerActiveTable, unregisterActiveTable } = useActiveTableSearch();
  // Capture the slug used at register time so cleanup targets the right entry
  // even if `slug` changes between renders.
  const registeredSlugRef = useRef(slug);

  useEffect(() => {
    registerActiveTable(slug, displayName);
    registeredSlugRef.current = slug;
    return () => {
      unregisterActiveTable(registeredSlugRef.current);
    };
  }, [slug, displayName, registerActiveTable, unregisterActiveTable]);
}
