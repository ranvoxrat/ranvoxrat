import type { ActivityLog } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import {
  ActivitySquare,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 15;

const ACTION_TYPES = [
  "all",
  "invite",
  "delete",
  "update",
  "grade",
  "submit",
  "login",
  "create",
  "reset",
];

const ACTION_COLOR: Record<string, string> = {
  invite: "bg-primary/20 text-primary border-primary/30",
  delete: "bg-destructive/20 text-destructive border-destructive/30",
  update: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  grade: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  submit: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  login: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  create: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  reset: "bg-muted text-muted-foreground border-border",
};

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLOR).find((k) =>
    action.toLowerCase().includes(k),
  );
  return key
    ? ACTION_COLOR[key]
    : "bg-muted text-muted-foreground border-border";
}

function formatTs(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tsToDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000);
}

export default function AdminActivityLog() {
  const { backend, isReady } = useBackend();

  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["admin", "activity-logs"],
    queryFn: async () => {
      if (!backend) throw new Error("Not ready");
      return backend.getActivityLogs();
    },
    enabled: isReady,
  });

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs
      .filter((log) => {
        const matchAction =
          actionFilter === "all" ||
          log.action.toLowerCase().includes(actionFilter.toLowerCase());
        const logDate = tsToDate(log.timestamp);
        const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
        const matchTo = !dateTo || logDate <= new Date(`${dateTo}T23:59:59`);
        return matchAction && matchFrom && matchTo;
      })
      .sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [logs, actionFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasDateFilter = dateFrom || dateTo;

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <AppLayout title="Activity Log">
      <div className="p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              data-ocid="admin.activity.action_filter.select"
              className="w-44 bg-card border-border"
            >
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t === "all" ? "All Actions" : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                data-ocid="admin.activity.date_filter.popover"
                className="gap-2 bg-card border-border text-muted-foreground hover:text-foreground"
              >
                <CalendarRange className="h-4 w-4" />
                {hasDateFilter
                  ? `${dateFrom || "…"} → ${dateTo || "…"}`
                  : "Date Range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              data-ocid="admin.activity.date_filter_content.popover"
              className="w-64 bg-card border-border p-4 space-y-3"
              align="start"
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  From
                </Label>
                <Input
                  data-ocid="admin.activity.date_from.input"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  To
                </Label>
                <Input
                  data-ocid="admin.activity.date_to.input"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-sm"
                />
              </div>
              {hasDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  data-ocid="admin.activity.clear_date.button"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => {
                    clearDateFilter();
                    setDatePopoverOpen(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filter
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {hasDateFilter && (
            <Button
              variant="ghost"
              size="sm"
              data-ocid="admin.activity.clear_date_pill.button"
              onClick={clearDateFilter}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear dates
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium w-[180px]">
                  Actor
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium w-[130px]">
                  Action
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                  Details
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium w-[170px] text-right">
                  Timestamp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-3.5 w-28" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-3.5 w-32 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-0 border-0">
                    <EmptyState
                      data-ocid="admin.activity.empty_state"
                      icon={ActivitySquare}
                      title="No activity found"
                      description="Try adjusting your filters to see more events."
                      className="border-0 rounded-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((log, i) => (
                  <TableRow
                    key={String(log.logId)}
                    data-ocid={`admin.activity.item.${i + 1}`}
                    className="border-border hover:bg-muted/30 transition-smooth"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-[10px] font-bold text-primary">
                            {log.actorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                          {log.actorName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium capitalize ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[400px]">
                        {log.details}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTs(log.timestamp)}
                      </time>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                data-ocid="admin.activity.pagination_prev"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="gap-1.5 border-border bg-card"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-ocid="admin.activity.pagination_next"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1.5 border-border bg-card"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
