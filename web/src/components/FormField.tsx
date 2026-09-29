import { cloneElement, useId, type ReactElement } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactElement<{
    id?: string;
    className?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }>;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-tinta">
        {label}
      </label>
      {cloneElement(children, {
        id,
        className: 'input',
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="text-sm text-carimbo-vermelho">
          {error}
        </p>
      )}
    </div>
  );
}
