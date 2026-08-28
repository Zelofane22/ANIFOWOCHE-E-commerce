import { forwardRef } from "react";

const FormField = forwardRef(function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = "",
  inputClass = "mt-1.5 w-full rounded-lg border border-black/15 px-4 py-3 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15",
  labelClass = "block text-sm font-semibold text-ink",
  children,
  ...props
}, ref) {
  return (
    <label className={labelClass}>
      {label}
      {children ? (
        children
      ) : (
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${inputClass} ${className}`}
          {...props}
        />
      )}
      {error && <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>}
    </label>
  );
});

FormField.displayName = "FormField";

export default FormField;
