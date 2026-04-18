import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  teacher: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  student: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  published: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  closed:
    "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  graded: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  reviewed: "bg-primary/20 text-primary border-primary/30",
  optimal: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  active: "bg-chart-3/20 text-chart-3 border-chart-3/30",
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-[11px] font-medium",
        ROLE_STYLES[role],
        className,
      )}
    >
      {role}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style =
    STATUS_STYLES[status.toLowerCase()] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <Badge
      variant="outline"
      className={cn("capitalize text-[11px] font-medium", style, className)}
    >
      {status}
    </Badge>
  );
}
