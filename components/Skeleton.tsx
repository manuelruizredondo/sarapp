export function SkeletonLine({ width = "100%", height = 12 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="rounded animate-pulse"
      style={{ width, height, background: "#E5EAF2" }}
    />
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonLine width={32} height={32} />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="40%" />
            <SkeletonLine width="20%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
