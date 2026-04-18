import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  loading?: boolean;
  "data-ocid"?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
  loading,
  "data-ocid": ocid,
}: StatCardProps) {
  return (
    <div
      data-ocid={ocid}
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <span className="font-display text-2xl font-bold text-foreground">
          {value}
        </span>
      )}
      {trend && (
        <span
          className={cn(
            "text-xs font-medium",
            trendUp ? "text-chart-3" : "text-destructive",
          )}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </span>
      )}
    </div>
  );
}
