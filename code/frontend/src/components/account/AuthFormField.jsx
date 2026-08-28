export default function AuthFormField({ label, type = "text", id, value, onChange, placeholder, required = false, autoComplete, className = "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20" }) {
  return (
    <label htmlFor={id} className="text-sm font-semibold text-ink">
      {label}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        className={`mt-1.5 w-full ${className}`}
      />
    </label>
  );
}
