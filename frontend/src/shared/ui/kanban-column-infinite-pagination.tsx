import { useCallback, useEffect, useRef, useState } from 'react';

type IdentifiableItem = {
  id: string;
};

export function useKanbanColumnPaginatedItems<T extends IdentifiableItem>({
  items,
  columnKey,
  resetKey,
  isPlaceholderData = false,
}: {
  items: T[];
  columnKey: string;
  resetKey: string;
  isPlaceholderData?: boolean;
}) {
  const [columnItems, setColumnItems] = useState<T[]>(items);
  const [loadedPage, setLoadedPage] = useState(1);
  const pageItemsRef = useRef<Record<number, T[]>>({});
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      pageItemsRef.current = {};
      setLoadedPage(1);
      setColumnItems(items);
    }

    if (isPlaceholderData) return;

    if (items.length === 0 && loadedPage === 1) {
      setColumnItems(items);
      return;
    }

    pageItemsRef.current = {
      ...pageItemsRef.current,
      [loadedPage]: items,
    };
    setColumnItems(mergePageItems(pageItemsRef.current, loadedPage));
  }, [isPlaceholderData, items, loadedPage, resetKey]);

  return {
    loadedPage,
    visibleItems: columnItems,
  };
}

export function KanbanColumnInfinitePagination<T extends string>({
  columnKey,
  pagination,
  isLoading,
  onPageChange,
}: {
  columnKey: T;
  pagination: { page: number; totalPages: number; hasNext: boolean; total: number; pageSize: number };
  isLoading: boolean;
  onPageChange: (columnKey: T, page: number) => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestedPageRef = useRef<number | null>(null);

  useEffect(() => {
    requestedPageRef.current = null;
  }, [pagination.page]);

  const requestNextPage = useCallback(() => {
    if (isLoading || !pagination.hasNext) return;

    const nextPage = pagination.page + 1;
    if (requestedPageRef.current === nextPage) return;

    requestedPageRef.current = nextPage;
    onPageChange(columnKey, nextPage);
  }, [isLoading, onPageChange, pagination.hasNext, pagination.page, columnKey]);

  useEffect(() => {
    if (pagination.totalPages <= 1) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          requestNextPage();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [pagination.totalPages, requestNextPage]);

  if (!pagination.hasNext) return null;

  const loadedCount = Math.min(pagination.total, pagination.page * pagination.pageSize);

  return (
    <div className="kanban-column-infinite-pagination" ref={sentinelRef} aria-live="polite">
      <span className="kanban-column-infinite-pagination-summary">
        {loadedCount} of {pagination.total}
      </span>
      {isLoading ? <span className="kanban-column-infinite-pagination-loading">Loading...</span> : null}
    </div>
  );
}

function mergePageItems<T extends IdentifiableItem>(pages: Record<number, T[]>, maxPage: number) {
  const seenIds = new Set<string>();
  const merged: T[] = [];

  for (let page = 1; page <= maxPage; page += 1) {
    for (const item of pages[page] || []) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      merged.push(item);
    }
  }

  return merged;
}
