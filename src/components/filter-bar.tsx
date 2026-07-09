import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function FilterBar({
  search,
  onSearch,
  onClear,
  hasActiveFilter,
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  onClear: () => void;
  hasActiveFilter: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-6 py-3 border-b border-border-subtle shrink-0">
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Buscar…"
        className="max-w-[220px]"
      />
      {children}
      {hasActiveFilter && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpar
        </Button>
      )}
    </div>
  );
}
