import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRepoStatus(
  repoId: string | null,
  onReady: (id: string) => void,
  onError: () => void
) {
  const supabase = createClient();

  useEffect(() => {
    if (!repoId) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("repositories")
        .select("status")
        .eq("id", repoId)
        .single();

      if (data?.status === "ready") {
        clearInterval(interval);
        onReady(repoId);
      } else if (data?.status === "error") {
        clearInterval(interval);
        onError();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [repoId]);
}