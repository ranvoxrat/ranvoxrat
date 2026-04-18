import type { Notification, UserProfile, UserRole } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  notifications: Notification[];
  sidebarCollapsed: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  setUserRole: (role: UserRole | null) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "read" | "createdAt">,
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userProfile: null,
      userRole: null,
      notifications: [],
      sidebarCollapsed: false,

      setUserProfile: (profile) => set({ userProfile: profile }),
      setUserRole: (role) => set({ userRole: role }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif_${Date.now()}`,
              read: false,
              createdAt: Date.now(),
            },
            ...state.notifications,
          ].slice(0, 50),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      reset: () =>
        set({
          userProfile: null,
          userRole: null,
          notifications: [],
          sidebarCollapsed: false,
        }),
    }),
    {
      name: "academia-ai-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
