import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useAppStore } from "@/store";
import type { UserProfile, UserRole } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { GraduationCap, UserPlus } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { principal, isAuthenticated, setProfile, logout } = useAuth();
  const { backend } = useBackend();
  const { addNotification } = useAppStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isAuthenticated) {
    navigate({ to: "/login" });
    return null;
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address.";
    if (!role) errs.role = "Select a role.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      // Persist profile to backend canister first
      if (backend) {
        await backend.saveCallerUserProfile(name.trim(), email.trim());
      }
      const profile: UserProfile = {
        id: principal ?? "unknown",
        name: name.trim(),
        email: email.trim(),
        role,
        createdAt: Date.now(),
      };
      setProfile(profile);
      addNotification({
        title: "Welcome!",
        message: `Account created successfully. You are now logged in as ${role}.`,
        type: "success",
      });
      const dashMap: Record<UserRole, string> = {
        admin: "/admin",
        teacher: "/teacher",
        student: "/student",
      };
      navigate({ to: dashMap[role] });
    } catch {
      addNotification({
        title: "Registration Failed",
        message: "Could not create your account. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-foreground">
              Complete Your Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your Academia AI account
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
            <UserPlus className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground font-mono truncate">
              {principal?.slice(0, 24)}...
            </span>
          </div>

          <form
            data-ocid="register.form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="reg-name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="reg-name"
                data-ocid="register.name_input"
                placeholder="Dr. Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  if (!name.trim())
                    setErrors((p) => ({ ...p, name: "Name is required." }));
                }}
                aria-invalid={!!errors.name}
                className="bg-background"
              />
              {errors.name && (
                <p
                  data-ocid="register.name.field_error"
                  className="text-xs text-destructive"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="reg-email"
                data-ocid="register.email_input"
                type="email"
                placeholder="jane@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  if (!email.trim())
                    setErrors((p) => ({ ...p, email: "Email is required." }));
                }}
                aria-invalid={!!errors.email}
                className="bg-background"
              />
              {errors.email && (
                <p
                  data-ocid="register.email.field_error"
                  className="text-xs text-destructive"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-role" className="text-sm font-medium">
                Role
              </Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger
                  id="reg-role"
                  data-ocid="register.role_select"
                  className="bg-background"
                >
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p
                  data-ocid="register.role.field_error"
                  className="text-xs text-destructive"
                >
                  {errors.role}
                </p>
              )}
            </div>

            <Button
              type="submit"
              data-ocid="register.submit_button"
              className="w-full font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Wrong identity?{" "}
            <button
              type="button"
              onClick={logout}
              className="text-primary hover:underline"
            >
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
