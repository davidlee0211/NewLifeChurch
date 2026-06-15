import { supabase } from "@/lib/supabase";

const cache = new Map<string, { id: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

// 진행 중인 시즌의 id 가져오기 (간단한 메모리 캐시)
export async function getCurrentSeasonId(churchId: string): Promise<string | null> {
  const cached = cache.get(churchId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.id;
  }

  const { data } = await supabase
    .from("seasons")
    .select("id")
    .eq("church_id", churchId)
    .is("ended_at", null)
    .order("season_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const seasonId = (data as { id: string }).id;
  cache.set(churchId, { id: seasonId, expiresAt: Date.now() + CACHE_TTL_MS });
  return seasonId;
}

// 시즌 종료/시작 시 캐시 무효화
export function invalidateCurrentSeasonCache(churchId?: string) {
  if (churchId) {
    cache.delete(churchId);
  } else {
    cache.clear();
  }
}
