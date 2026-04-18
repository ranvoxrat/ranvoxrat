import { Toaster } from "@/components/ui/sonner";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminActivityLog from "@/pages/admin/ActivityLog";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import StudentExamDetail from "@/pages/student/ExamDetail";
import StudentExams from "@/pages/student/Exams";
import StudentResultDetail from "@/pages/student/ResultDetail";
import StudentResults from "@/pages/student/Results";
import TeacherAnalytics from "@/pages/teacher/Analytics";
import TeacherClasses from "@/pages/teacher/Classes";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import TeacherExams from "@/pages/teacher/Exams";
import TeacherSubmissions from "@/pages/teacher/Submissions";
import { useAppStore } from "@/store";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

// Auth guard helper
function requireAuth(role?: "admin" | "teacher" | "student") {
  const { userProfile, userRole } = useAppStore.getState();
  if (!userProfile) {
    throw redirect({ to: "/login" });
  }
  if (role && userRole !== role) {
    const dashMap: Record<string, string> = {
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
    };
    const dest = dashMap[userRole ?? ""] ?? "/login";
    throw redirect({ to: dest });
  }
}

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { userProfile, userRole } = useAppStore.getState();
    if (!userProfile) throw redirect({ to: "/login" });
    const dashMap: Record<string, string> = {
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
    };
    throw redirect({ to: dashMap[userRole ?? ""] ?? "/login" });
  },
  component: () => null,
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: () => requireAuth("admin"),
  component: () => <Outlet />,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: AdminDashboard,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/users",
  component: AdminUsers,
});

const adminActivityRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/activity",
  component: AdminActivityLog,
});

// Teacher routes
const teacherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher",
  beforeLoad: () => requireAuth("teacher"),
  component: () => <Outlet />,
});

const teacherIndexRoute = createRoute({
  getParentRoute: () => teacherRoute,
  path: "/",
  component: TeacherDashboard,
});

const teacherClassesRoute = createRoute({
  getParentRoute: () => teacherRoute,
  path: "/classes",
  component: TeacherClasses,
});

const teacherExamsRoute = createRoute({
  getParentRoute: () => teacherRoute,
  path: "/exams",
  component: TeacherExams,
});

const teacherAnalyticsRoute = createRoute({
  getParentRoute: () => teacherRoute,
  path: "/analytics",
  component: TeacherAnalytics,
});

const teacherSubmissionsRoute = createRoute({
  getParentRoute: () => teacherRoute,
  path: "/submissions",
  component: TeacherSubmissions,
});

// Student routes
const studentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  beforeLoad: () => requireAuth("student"),
  component: () => <Outlet />,
});

const studentIndexRoute = createRoute({
  getParentRoute: () => studentRoute,
  path: "/",
  component: StudentExams,
});

const studentExamDetailRoute = createRoute({
  getParentRoute: () => studentRoute,
  path: "/exam/$examId",
  component: StudentExamDetail,
});

const studentResultsRoute = createRoute({
  getParentRoute: () => studentRoute,
  path: "/results",
  component: StudentResults,
});

const studentResultDetailRoute = createRoute({
  getParentRoute: () => studentRoute,
  path: "/results/$submissionId",
  component: StudentResultDetail,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  adminRoute.addChildren([
    adminIndexRoute,
    adminUsersRoute,
    adminActivityRoute,
  ]),
  teacherRoute.addChildren([
    teacherIndexRoute,
    teacherClassesRoute,
    teacherExamsRoute,
    teacherAnalyticsRoute,
    teacherSubmissionsRoute,
  ]),
  studentRoute.addChildren([
    studentIndexRoute,
    studentExamDetailRoute,
    studentResultsRoute,
    studentResultDetailRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
