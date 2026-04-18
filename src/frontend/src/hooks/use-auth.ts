import { useAppStore } from "@/store";
import type { UserProfile, UserRole } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const { identity, loginStatus, login, clear } = useInternetIdentity();
  const { userProfile, userRole, setUserProfile, setUserRole, reset } =
    useAppStore();

  const isAuthenticated = loginStatus === "success" && identity !== undefined;
  const isLoading =
    loginStatus === "initializing" || loginStatus === "logging-in";

  const principal = identity?.getPrincipal().toText() ?? null;

  const logout = useCallback(async () => {
    await clear();
    reset();
  }, [clear, reset]);

  const setProfile = useCallback(
    (profile: UserProfile) => {
      setUserProfile(profile);
      setUserRole(profile.role);
    },
    [setUserProfile, setUserRole],
  );

  const clearProfile = useCallback(() => {
    setUserProfile(null);
    setUserRole(null);
  }, [setUserProfile, setUserRole]);

  // Clear profile when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearProfile();
    }
  }, [isAuthenticated, clearProfile]);

  return {
    identity,
    principal,
    isAuthenticated,
    isLoading,
    loginStatus,
    login,
    logout,
    userProfile,
    userRole: userRole as UserRole | null,
    setProfile,
    clearProfile,
  };
}
