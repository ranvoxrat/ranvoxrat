import type { Class } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/use-backend";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CLASS_COLORS = [
  "from-primary/30 to-primary/5",
  "from-amber-500/30 to-amber-500/5",
  "from-emerald-500/30 to-emerald-500/5",
  "from-chart-5/30 to-chart-5/5",
];

function CreateClassDialog({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const { backend } = useBackend();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: () => backend!.createClass(name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      toast.success("Class created successfully");
      setName("");
      onClose();
    },
    onError: () => toast.error("Failed to create class"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="teacher.create_class.dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Create New Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="class-name">Class Name</Label>
            <Input
              id="class-name"
              data-ocid="teacher.create_class.name_input"
              placeholder="e.g. Advanced Algorithms CS401"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && name.trim() && createMutation.mutate()
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="teacher.create_class.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            data-ocid="teacher.create_class.submit_button"
          >
            {createMutation.isPending ? "Creating…" : "Create Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditClassDialog({
  cls,
  onClose,
}: {
  cls: Class | null;
  onClose: () => void;
}) {
  const { backend } = useBackend();
  const queryClient = useQueryClient();
  const [name, setName] = useState(cls?.name ?? "");

  const updateMutation = useMutation({
    mutationFn: () => backend!.updateClass(cls!.classId, name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      toast.success("Class updated");
      onClose();
    },
    onError: () => toast.error("Failed to update class"),
  });

  if (!cls) return null;
  return (
    <Dialog open={!!cls} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="teacher.edit_class.dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Edit Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-class-name">Class Name</Label>
            <Input
              id="edit-class-name"
              data-ocid="teacher.edit_class.name_input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="teacher.edit_class.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!name.trim() || updateMutation.isPending}
            data-ocid="teacher.edit_class.save_button"
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClassDetailSheet({
  cls,
  onClose,
}: {
  cls: Class | null;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [principalInput, setPrincipalInput] = useState("");

  if (!cls) return null;

  const filtered = cls.studentIds.filter((sid) =>
    sid.toText().toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={!!cls} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="teacher.class_detail.dialog"
        className="sm:max-w-lg max-h-[85vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="font-display">{cls.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-border text-muted-foreground gap-1.5"
            >
              <Users className="h-3 w-3" />
              {cls.studentIds.length} students
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Add Student by Principal ID</Label>
            <div className="flex gap-2">
              <Input
                data-ocid="teacher.class_detail.principal_input"
                placeholder="Principal ID (e.g. xxxxx-xxxxx-…)"
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                className="flex-1 font-mono text-xs"
              />
              <Button
                size="sm"
                disabled={!principalInput.trim()}
                data-ocid="teacher.class_detail.add_student_button"
                onClick={() => {
                  try {
                    Principal.fromText(principalInput.trim());
                    toast.info(
                      "Student enrollment is managed by the admin. Ask the admin to invite the student to the platform.",
                    );
                    setPrincipalInput("");
                  } catch {
                    toast.error("Invalid principal ID");
                  }
                }}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              data-ocid="teacher.class_detail.search_input"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <ScrollArea className="flex-1 max-h-60">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No students enrolled
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((sid, i) => (
                  <div
                    key={sid.toText()}
                    data-ocid={`teacher.class_detail.student.${i + 1}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/50"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
                        {sid.toText().slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="flex-1 min-w-0 font-mono text-xs text-foreground truncate">
                      {sid.toText()}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Remove student"
                      data-ocid={`teacher.class_detail.remove_student.${i + 1}`}
                      onClick={() => toast.info("Remove student coming soon")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="teacher.class_detail.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TeacherClasses() {
  const { backend, isReady } = useBackend();
  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [detailClass, setDetailClass] = useState<Class | null>(null);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => backend!.getClasses(),
    enabled: isReady,
  });

  return (
    <AppLayout title="My Classes">
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Classes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {classes.length} classes ·{" "}
              {classes.reduce((s, c) => s + c.studentIds.length, 0)} total
              students
            </p>
          </div>
          <Button
            data-ocid="teacher.classes.add_button"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Class
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            data-ocid="teacher.classes.empty_state"
            icon={BookOpen}
            title="No classes yet"
            description="Create your first class to start assigning exams to students."
            action={{
              label: "Create Class",
              onClick: () => setCreateOpen(true),
              "data-ocid": "teacher.classes.empty_add_button",
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((cls, i) => (
              <Card
                key={String(cls.classId)}
                data-ocid={`teacher.classes.item.${i + 1}`}
                className="group border-border bg-card hover:border-primary/40 transition-smooth cursor-pointer"
                onClick={() => setDetailClass(cls)}
              >
                <CardHeader className="pb-3">
                  <div
                    className={`mb-3 h-1.5 w-full rounded-full bg-gradient-to-r ${CLASS_COLORS[i % CLASS_COLORS.length]}`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-foreground leading-snug">
                      {cls.name}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        data-ocid={`teacher.classes.edit.${i + 1}`}
                        aria-label="Edit class"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditClass(cls);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 hover:text-destructive hover:bg-destructive/10"
                        data-ocid={`teacher.classes.delete.${i + 1}`}
                        aria-label="Delete class"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.error(
                            "Class deletion is not available. Contact your administrator.",
                          );
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="gap-1.5 text-xs text-muted-foreground border-border"
                    >
                      <Users className="h-3 w-3" />
                      {cls.studentIds.length} students
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(Number(cls.createdAt)).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-primary/60 font-medium">
                    Click to view roster →
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateClassDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <EditClassDialog cls={editClass} onClose={() => setEditClass(null)} />
      <ClassDetailSheet
        cls={detailClass}
        onClose={() => setDetailClass(null)}
      />
    </AppLayout>
  );
}
