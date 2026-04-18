import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

/**
 * useBackend — thin wrapper around useActor that provides
 * the typed Backend actor instance for all canister calls.
 * All queries and mutations should go through this hook.
 */
export function useBackend() {
  const { actor, isFetching } = useActor(createActor);

  return {
    backend: actor,
    isReady: !!actor && !isFetching,
    isFetching,
  };
}
