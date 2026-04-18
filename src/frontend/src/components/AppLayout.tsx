import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import type { UserRole } from "@/types";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ActivitySquare,
  BarChart2,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  "data-ocid": string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      "data-ocid": "nav.admin_dashboard.link",
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
      "data-ocid": "nav.admin_users.link",
    },
    {
      label: "Activity Log",
      href: "/admin/activity",
      icon: ActivitySquare,
      "data-ocid": "nav.admin_activity.link",
    },
  ],
  teacher: [
    {
      label: "Dashboard",
      href: "/teacher",
      icon: LayoutDashboard,
      "data-ocid": "nav.teacher_dashboard.link",
    },
    {
      label: "Classes",
      href: "/teacher/classes",
      icon: BookOpen,
      "data-ocid": "nav.teacher_classes.link",
    },
    {
      label: "Exams",
      href: "/teacher/exams",
      icon: FileText,
      "data-ocid": "nav.teacher_exams.link",
    },
    {
      label: "Analytics",
      href: "/teacher/analytics",
      icon: BarChart2,
      "data-ocid": "nav.teacher_analytics.link",
    },
    {
      label: "Submissions",
      href: "/teacher/submissions",
      icon: ClipboardList,
      "data-ocid": "nav.teacher_submissions.link",
    },
  ],
  student: [
    {
      label: "My Exams",
      href: "/student",
      icon: GraduationCap,
      "data-ocid": "nav.student_exams.link",
    },
    {
      label: "My Results",
      href: "/student/results",
      icon: ClipboardList,
      "data-ocid": "nav.student_results.link",
    },
  ],
};

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  teacher: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  student: "bg-chart-3/20 text-chart-3 border-chart-3/30",
};

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebar, notifications } = useAppStore();
  const { userProfile, userRole, logout } = useAuth();
  const router = useRouter();

  const navItems = userRole ? NAV_ITEMS[userRole] : [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentPath = router.state.location.pathname;

  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            Academia <span className="text-primary">AI</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/teacher" &&
                item.href !== "/student" &&
                currentPath.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                data-ocid={item["data-ocid"]}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                  sidebarCollapsed ? "justify-center" : "",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {isActive && !sidebarCollapsed && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60" />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-border" />

      {/* User section */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2",
            sidebarCollapsed ? "justify-center" : "",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {userProfile?.name ?? "Unknown User"}
              </p>
              {userRole && (
                <Badge
                  className={cn(
                    "mt-0.5 text-[10px] capitalize",
                    ROLE_BADGE_STYLES[userRole],
                  )}
                  variant="outline"
                >
                  {userRole}
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          data-ocid="nav.logout_button"
          onClick={logout}
          className={cn(
            "mt-2 w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            sidebarCollapsed ? "justify-center px-2" : "justify-start gap-2",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Log out</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-smooth shrink-0",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-sidebar border-r border-sidebar-border transition-smooth md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:px-6 shrink-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            data-ocid="nav.mobile_menu_button"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Desktop toggle */}
          <Button
            variant="ghost"
            size="icon"
            data-ocid="nav.sidebar_toggle"
            className="hidden md:flex"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="font-display text-base font-semibold text-foreground truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              data-ocid="nav.notifications_button"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
