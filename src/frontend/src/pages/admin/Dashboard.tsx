import type { ActivityLog, DashboardStats } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import { ActivitySquare, BookOpen, Clock, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ACTION_COLOR: Record<string, string> = {
  invite: "bg-primary/20 text-primary border-primary/30",
  delete: "bg-destructive/20 text-destructive border-destructive/30",
  update: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  grade: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  submit: "bg-chart-5/20 text-chart-5 border-chart-5/30",
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CHART_DATA = [
  { month: "Nov", exams: 0 },
  { month: "Dec", exams: 0 },
  { month: "Jan", exams: 0 },
  { month: "Feb", exams: 0 },
  { month: "Mar", exams: 0 },
  { month: "Apr", exams: 0 },
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function buildChartData(
  logs: ActivityLog[] | undefined,
): { month: string; exams: number }[] {
  if (!logs || logs.length === 0) return CHART_DATA;
  // Count createExam actions per month for the last 6 months
  const now = new Date();
  const counts: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    counts[`${d.getFullYear()}-${d.getMonth()}`] = 0;
  }
  for (const log of logs) {
    if (
      !log.action.toLowerCase().includes("createexam") &&
      !log.action.toLowerCase().includes("createclass")
    )
      continue;
    const ts = Number(log.timestamp) / 1_000_000;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in counts) counts[key]++;
  }
  return Object.entries(counts).map(([key, exams]) => {
    const [year, month] = key.split("-").map(Number);
    return { month: `${MONTH_LABELS[month]} ${String(year).slice(2)}`, exams };
  });
}

export default function AdminDashboard() {
  const { backend, isReady } = useBackend();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      if (!backend) throw new Error("Not ready");
      return backend.getDashboardStats();
    },
    enabled: isReady,
  });

  const { data: logs, isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["admin", "activity-logs"],
    queryFn: async () => {
      if (!backend) throw new Error("Not ready");
      return backend.getActivityLogs();
    },
    enabled: isReady,
  });

  const recentLogs = logs
    ? [...logs].sort((a, b) => Number(b.timestamp - a.timestamp)).slice(0, 8)
    : [];

  const chartData = buildChartData(logs);

  return (
    <AppLayout title="Admin Dashboard">
      <div className="p-6 space-y-8">
        {/* Stat Cards */}
        <section>
          <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              data-ocid="admin.stat_teachers.card"
              label="Total Teachers"
              value={statsLoading ? "—" : Number(stats?.totalTeachers ?? 0)}
              icon={Users}
              loading={statsLoading}
            />
            <StatCard
              data-ocid="admin.stat_students.card"
              label="Total Students"
              value={statsLoading ? "—" : Number(stats?.totalStudents ?? 0)}
              icon={BookOpen}
              loading={statsLoading}
            />
            <StatCard
              data-ocid="admin.stat_active_exams.card"
              label="Active Exams"
              value={statsLoading ? "—" : Number(stats?.activeExams ?? 0)}
              icon={Clock}
              loading={statsLoading}
            />
            <StatCard
              data-ocid="admin.stat_pending.card"
              label="Pending Submissions"
              value={
                statsLoading ? "—" : Number(stats?.pendingSubmissions ?? 0)
              }
              icon={ActivitySquare}
              loading={statsLoading}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Chart */}
          <section className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-sm font-semibold text-foreground mb-1">
              Exams per Month
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Activity trend over the last 6 months
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fill: "oklch(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: "oklch(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(var(--card))",
                    border: "1px solid oklch(var(--border))",
                    borderRadius: "8px",
                    color: "oklch(var(--foreground))",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "oklch(var(--muted) / 0.4)" }}
                />
                <Bar
                  dataKey="exams"
                  fill="oklch(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Recent Activity Feed */}
          <section
            data-ocid="admin.recent_activity.section"
            className="lg:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col"
          >
            <h2 className="font-display text-sm font-semibold text-foreground mb-1">
              Recent Activity
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Latest system events
            </p>
            {logsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                  <div key={i} className="flex gap-3 items-start">
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <EmptyState
                data-ocid="admin.recent_activity.empty_state"
                icon={ActivitySquare}
                title="No activity yet"
                description="System events will appear here."
              />
            ) : (
              <ul className="space-y-3 overflow-y-auto flex-1">
                {recentLogs.map((log, i) => (
                  <li
                    key={String(log.logId)}
                    data-ocid={`admin.recent_activity.item.${i + 1}`}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-[10px] font-bold text-primary">
                        {log.actorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {log.actorName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {log.details}
                      </p>
                      <time className="text-[10px] text-muted-foreground/60 mt-0.5 block">
                        {formatTs(log.timestamp)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
