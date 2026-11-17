import React from 'react';

const LABEL_CLASS = 'block text-xs uppercase tracking-wider text-paper-white mb-1.5 font-bold';
const INPUT_CLASS =
  'w-full px-4 py-3 border-2 bg-space-base text-paper-white placeholder:text-muted-gray/60 text-xs sm:text-sm font-mono focus:outline-none transition-all';

const inputStateClass = (invalid: boolean): string =>
  invalid ? 'border-bebop-red focus:ring-2 focus:ring-bebop-red' : 'border-paper-white focus:border-bebop-red';

const errorId = (id: string): string => `${id}-error`;

interface FieldErrorProps {
  id: string;
  field: string;
  message: string;
}

const FieldError: React.FC<FieldErrorProps> = ({ id, field, message }) => (
  <span
    id={errorId(id)}
    {...{ [`data-error-${field}`]: '' }}
    className="text-bebop-red text-[11px] mt-1.5 flex items-center gap-1.5 font-bold"
  >
    <span aria-hidden="true">■</span>
    <span>{message}</span>
  </span>
);

const OptionalTag: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <>
      {' '}
      <span className="ml-1 text-muted-gray font-normal">{text}</span>
    </>
  ) : null;

interface TextFieldProps {
  id: string;
  field: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  maxLength: number;
  error?: string;
  optionalTag?: string;
  multiline?: boolean;
  type?: 'text' | 'email' | 'tel';
  inputMode?: 'text' | 'email' | 'tel';
  autoComplete?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  field,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  error,
  optionalTag,
  multiline = false,
  type = 'text',
  inputMode,
  autoComplete,
}) => {
  const shared = {
    id,
    name: field,
    value,
    placeholder,
    maxLength,
    autoComplete,
    onBlur,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId(id) : undefined,
    [`data-input-${field}`]: '',
    className: `${INPUT_CLASS} ${inputStateClass(Boolean(error))}${multiline ? ' resize-none' : ''}`,
  };

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        <OptionalTag text={optionalTag} />
      </label>
      {multiline ? (
        <textarea {...shared} rows={5} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...shared} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && <FieldError id={id} field={field} message={error} />}
    </div>
  );
};

interface ChoiceOption {
  value: string;
  label: string;
}

interface ChoiceGroupProps {
  id: string;
  field: string;
  legend: string;
  type: 'checkbox' | 'radio';
  options: readonly ChoiceOption[];
  selected: readonly string[];
  onSelect: (value: string) => void;
  onLeave?: () => void;
  error?: string;
}

export const ChoiceGroup: React.FC<ChoiceGroupProps> = ({ id, field, legend, type, options, selected, onSelect, onLeave, error }) => (
  <fieldset
    id={id}
    onBlur={(e) => {
      if (onLeave && !e.currentTarget.contains(e.relatedTarget)) onLeave();
    }}
    {...{ [`data-group-${field}`]: '' }}
    aria-describedby={error ? errorId(id) : undefined}
    className="@container min-w-0"
  >
    <legend className={LABEL_CLASS}>{legend}</legend>
    <div className="grid grid-cols-1 @md:grid-cols-2 gap-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-2.5 px-3 py-2.5 border-2 text-xs font-mono text-paper-white cursor-pointer transition-colors hover:border-bebop-red has-[:checked]:border-bebop-red has-[:checked]:bg-bebop-red/15 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bebop-red ${
            error ? 'border-bebop-red' : 'border-paper-white/40'
          }`}
        >
          <input
            type={type}
            name={field}
            value={option.value}
            checked={selected.includes(option.value)}
            onChange={() => onSelect(option.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId(id) : undefined}
            className="mt-0.5 size-4 shrink-0 accent-bebop-red"
          />
          <span className="break-words min-w-0">{option.label}</span>
        </label>
      ))}
    </div>
    {error && <FieldError id={id} field={field} message={error} />}
  </fieldset>
);
