import type { UserId, UserProfile } from "@/backend.d";
import { UserRole as UserRoleEnum } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { RoleBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Key,
  MoreHorizontal,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type UserEntry = [UserId, UserProfile];
type RoleFilter = "all" | "admin" | "teacher" | "student";

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsers() {
  const { backend, isReady } = useBackend();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserEntry | null>(null);
  const [inviteForm, setInviteForm] = useState({
    principal: "",
    name: "",
    email: "",
    role: "student" as "admin" | "teacher" | "student",
  });

  const { data: users, isLoading } = useQuery<UserEntry[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      if (!backend) throw new Error("Not ready");
      return backend.getUsers();
    },
    enabled: isReady,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!backend) throw new Error("Not ready");
      const principal = Principal.fromText(inviteForm.principal);
      const roleEnum =
        UserRoleEnum[inviteForm.role as keyof typeof UserRoleEnum];
      await backend.inviteUser(
        principal,
        inviteForm.name,
        inviteForm.email,
        roleEnum,
      );
    },
    onSuccess: () => {
      toast.success("User invited successfully");
      setInviteOpen(false);
      setInviteForm({ principal: "", name: "", email: "", role: "student" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Failed to invite user"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: UserId; role: string }) => {
      if (!backend) throw new Error("Not ready");
      const roleEnum = UserRoleEnum[role as keyof typeof UserRoleEnum];
      await backend.updateUserRole(userId, roleEnum);
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Failed to update role"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: UserId) => {
      if (!backend) throw new Error("Not ready");
      return backend.resetUserPassword(userId);
    },
    onSuccess: (newPass) => {
      toast.success(`Password reset. Temporary: ${newPass}`, {
        duration: 8000,
      });
    },
    onError: () => toast.error("Failed to reset password"),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter(([, profile]) => {
      const matchRole = roleFilter === "all" || profile.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        profile.name.toLowerCase().includes(q) ||
        profile.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  return (
    <AppLayout title="User Management">
      <div className="p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                data-ocid="admin.users.search_input"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v as RoleFilter)}
            >
              <SelectTrigger
                data-ocid="admin.users.role_filter.select"
                className="w-36 bg-card border-border"
              >
                <SelectValue placeholder="Filter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            data-ocid="admin.users.invite_user.open_modal_button"
            onClick={() => setInviteOpen(true)}
            className="shrink-0 gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                  Name
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                  Email
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                  Role
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                  Joined
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-medium text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-3.5 w-28" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-7 w-7 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-0 border-0">
                    <EmptyState
                      data-ocid="admin.users.empty_state"
                      icon={Users}
                      title="No users found"
                      description={
                        search || roleFilter !== "all"
                          ? "Try adjusting your search or filter."
                          : "Invite someone to get started."
                      }
                      action={
                        !search && roleFilter === "all"
                          ? {
                              label: "Invite User",
                              onClick: () => setInviteOpen(true),
                              "data-ocid": "admin.users.empty_invite.button",
                            }
                          : undefined
                      }
                      className="border-0 rounded-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(([userId, profile], i) => (
                  <TableRow
                    key={userId.toText()}
                    data-ocid={`admin.users.item.${i + 1}`}
                    className="border-border hover:bg-muted/30 transition-smooth"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                          <span className="text-xs font-bold text-primary">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                          {profile.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {profile.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(v) =>
                          updateRoleMutation.mutate({ userId, role: v })
                        }
                      >
                        <SelectTrigger
                          data-ocid={`admin.users.role_select.${i + 1}`}
                          className="w-28 h-7 text-xs bg-transparent border-transparent hover:border-border focus:border-border transition-smooth p-0"
                        >
                          <RoleBadge
                            role={
                              profile.role as "admin" | "teacher" | "student"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(profile.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`admin.users.actions.${i + 1}`}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label="User actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            data-ocid={`admin.users.reset_password.${i + 1}`}
                            className="gap-2"
                            onClick={() => resetPasswordMutation.mutate(userId)}
                          >
                            <Key className="h-3.5 w-3.5" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            data-ocid={`admin.users.delete_button.${i + 1}`}
                            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setDeleteTarget([userId, profile])}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent
          data-ocid="admin.users.invite.dialog"
          className="sm:max-w-md bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              Invite New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Principal ID
              </Label>
              <Input
                data-ocid="admin.users.invite.principal_input"
                placeholder="aaaaa-bbbbb-…"
                value={inviteForm.principal}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, principal: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Full Name
              </Label>
              <Input
                data-ocid="admin.users.invite.name_input"
                placeholder="Jane Doe"
                value={inviteForm.name}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, name: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                data-ocid="admin.users.invite.email_input"
                type="email"
                placeholder="jane@school.edu"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, email: e.target.value }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Role
              </Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) =>
                  setInviteForm((f) => ({
                    ...f,
                    role: v as "admin" | "teacher" | "student",
                  }))
                }
              >
                <SelectTrigger
                  data-ocid="admin.users.invite.role_select"
                  className="bg-background border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              data-ocid="admin.users.invite.cancel_button"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.users.invite.submit_button"
              onClick={() => inviteMutation.mutate()}
              disabled={
                inviteMutation.isPending ||
                !inviteForm.principal ||
                !inviteForm.name ||
                !inviteForm.email
              }
            >
              {inviteMutation.isPending ? "Inviting…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          data-ocid="admin.users.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">
                {deleteTarget?.[1].name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.users.delete.cancel_button"
              className="border-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.users.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  toast.error(
                    "User deletion is not supported at the canister level. To remove a user, update their role or contact the system administrator.",
                  );
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
