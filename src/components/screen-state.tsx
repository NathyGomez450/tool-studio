export function ScreenLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-tertiary">
      Carregando…
    </div>
  );
}

export function ScreenError() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-danger">
      Erro ao carregar dados.
    </div>
  );
}

export function ScreenEmpty({ message = 'Nada por aqui.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <div className="text-sm font-medium text-secondary">{message}</div>
      <div className="text-xs text-tertiary">Ajuste os filtros ou crie um novo item.</div>
    </div>
  );
}
