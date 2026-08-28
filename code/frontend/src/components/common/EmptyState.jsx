import { Link } from "react-router";

export default function EmptyState({
  icon,
  title = "Aucun élément",
  description = "",
  actionLabel,
  actionHref,
  className = "rounded-xl border border-black/10 bg-white px-4 py-10 text-center text-muted",
}) {
  return (
    <div className={className}>
      {icon && <icon size={36} className="mx-auto mb-3 opacity-30" />}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
