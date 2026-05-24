export default function EmptyState({
  icon = "📭",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-8 text-center">
      <div className="text-4xl mb-2" aria-hidden>{icon}</div>
      <div className="font-semibold mb-1" style={{ color: "#062E73" }}>{title}</div>
      {hint && (
        <p className="text-sm mb-4" style={{ color: "#7B8794" }}>{hint}</p>
      )}
      {action}
    </div>
  );
}
