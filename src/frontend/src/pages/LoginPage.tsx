import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, GraduationCap, ShieldCheck, User, Zap } from "lucide-react";
import { useEffect } from "react";

const ROLE_CARDS = [
  {
    icon: ShieldCheck,
    role: "Admin",
    description:
      "Manage users, monitor exams, view system analytics and activity logs.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BookOpen,
    role: "Teacher",
    description:
      "Create exams, upload answer keys, review AI-graded submissions.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: User,
    role: "Student",
    description:
      "Take assigned exams, view AI-generated scores and detailed feedback.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading, login, userProfile, userRole } =
    useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && userProfile) {
      const dashMap: Record<string, string> = {
        admin: "/admin",
        teacher: "/teacher",
        student: "/student",
      };
      navigate({ to: dashMap[userRole ?? ""] ?? "/register" });
    } else if (isAuthenticated && !userProfile) {
      navigate({ to: "/register" });
    }
  }, [isAuthenticated, userProfile, userRole, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero section */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-elevation">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Academia <span className="text-primary">AI</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              AI-powered examination management system
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <div className="mb-6 flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Secure authentication via Internet Identity
            </span>
          </div>

          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Sign in with your Internet Identity to access the platform. Your
            identity is cryptographically secured on the Internet Computer.
          </p>

          <Button
            data-ocid="login.primary_button"
            className="w-full font-semibold"
            size="lg"
            onClick={() => login()}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Connecting...
              </span>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            No password required. No email needed.
          </p>
        </div>

        <Separator className="my-12 w-full max-w-2xl bg-border/50" />

        {/* Role cards */}
        <div className="w-full max-w-2xl">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Platform Roles
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ROLE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.role}
                  className="rounded-xl border border-border bg-card/50 p-5"
                >
                  <div
                    className={cn(
                      "mb-3 flex h-9 w-9 items-center justify-center rounded-lg",
                      card.bg,
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5", card.color)} />
                  </div>
                  <h3 className="mb-1.5 font-display text-sm font-semibold text-foreground">
                    {card.role}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
