import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  className,
  title,
  footer,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string; footer?: React.ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-[var(--bg-overlay)] z-50" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw]',
          'bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden font-sans',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <DialogPrimitive.Title className="font-semibold text-[15px] text-primary">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close className="text-tertiary hover:text-primary">
            <X size={16} />
          </DialogPrimitive.Close>
        </div>
        <div className="p-5 text-[13px] text-secondary">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-border-subtle">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
