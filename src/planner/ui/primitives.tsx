/** Small shared building blocks used across planner tabs. */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Card({ title, subtitle, action, children, tone }: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  tone?: 'plain' | 'accent';
}) {
  return (
    <section className={`pl-card ${tone === 'accent' ? 'accent' : ''}`}>
      {(title || action) && (
        <header className="pl-card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Bar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="pl-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tone }} />
    </div>
  );
}

export function Ring({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="pl-ring" style={{ ['--ring' as string]: `${clamped * 3.6}deg` }}>
      <div className="pl-ring-inner">
        <strong>{clamped}%</strong>
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="pl-empty">
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Sheet({ title, onClose, children, footer }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="pl-sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <button className="pl-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="pl-sheet">
        <header>
          <h3>{title}</h3>
          <button className="pl-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="pl-sheet-body">{children}</div>
        {footer && <footer className="pl-sheet-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange, multi }: {
  options: { value: T; label: string; hint?: string }[];
  value: T[] | T;
  onChange: (value: T) => void;
  multi?: boolean;
}) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div className="pl-chips">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={selected.includes(option.value) ? 'chip active' : 'chip'}
          onClick={() => onChange(option.value)}
          aria-pressed={selected.includes(option.value)}
        >
          <span>{option.label}</span>
          {option.hint && <small>{option.hint}</small>}
          {multi && selected.includes(option.value) && <b>✓</b>}
        </button>
      ))}
    </div>
  );
}

export function Toast({ message, actionLabel, onAction, onDismiss }: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="pl-toast" role="status">
      <span>{message}</span>
      {actionLabel && onAction && <button onClick={onAction}>{actionLabel}</button>}
      <button className="pl-toast-x" onClick={onDismiss} aria-label="Dismiss"><X size={15} /></button>
    </div>
  );
}
