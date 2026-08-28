export default function LoadingState({ message = "Chargement…", className = "px-4 py-10 text-center text-muted" }) {
  return <p className={className}>{message}</p>;
}
