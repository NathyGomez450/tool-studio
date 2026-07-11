import * as React from 'react';

/**
 * Marca do Origem Studio. Usa /logo.png (colocar em public/logo.png),
 * enquadrada no emblema (recorta o texto inferior). Se a imagem faltar,
 * cai no fallback com a letra "O".
 */
export function LogoMark({ size = 26, rounded = 'rounded-lg' }: { size?: number; rounded?: string }) {
  const [err, setErr] = React.useState(false);

  if (err) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`${rounded} bg-[var(--accent-500)] flex items-center justify-center font-bold text-[13px] text-[var(--text-on-accent)]`}
      >
        O
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }} className={`${rounded} overflow-hidden bg-canvas shrink-0`}>
      <img
        src="/logo.png"
        alt="Origem Studio"
        onError={() => setErr(true)}
        className="w-full h-full object-cover"
        style={{ objectPosition: '50% 30%', transform: 'scale(1.55)' }}
      />
    </div>
  );
}
