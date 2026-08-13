function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function CategoryCascadeSelect({
  tree,
  l1Id,
  l2Id,
  l3Id,
  onChange,
  disabled,
  inputClass,
  className = "",
}) {
  const l1Node = tree.find((n) => String(n.id) === l1Id);
  const l2Options = l1Node?.children || [];
  const l2Node = l2Options.find((n) => String(n.id) === l2Id);
  const l3Options = l2Node?.children || [];

  return (
    <div className={`grid gap-4 sm:grid-cols-3 ${className}`}>
      <Field label="Catégorie">
        <select
          className={inputClass}
          value={l1Id}
          disabled={disabled || tree.length === 0}
          onChange={(event) => onChange("l1", event.target.value)}
        >
          <option value="">Choisir</option>
          {tree.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sous-catégorie (optionnel)">
        <select
          className={inputClass}
          value={l2Id}
          disabled={disabled || !l1Id}
          onChange={(event) => onChange("l2", event.target.value)}
        >
          <option value="">Choisir</option>
          {l2Options.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Type (optionnel)">
        <select
          className={inputClass}
          value={l3Id}
          disabled={disabled || !l2Id}
          onChange={(event) => onChange("l3", event.target.value)}
        >
          <option value="">Choisir</option>
          {l3Options.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
