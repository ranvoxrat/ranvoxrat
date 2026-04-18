import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    "data-ocid"?: string;
  };
  className?: string;
  "data-ocid"?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  "data-ocid": ocid,
}: EmptyStateProps) {
  return (
    <div
      data-ocid={ocid}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 px-6 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button
          className="mt-5"
          data-ocid={action["data-ocid"]}
          onClick={action.onClick}
          size="sm"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
