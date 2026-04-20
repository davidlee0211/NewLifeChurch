import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS_TO_KEEP = 7;

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

async function removeInBatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  bucket: string,
  paths: string[]
) {
  const BATCH = 100;
  let removed = 0;
  let failed = 0;
  for (let i = 0; i < paths.length; i += BATCH) {
    const chunk = paths.slice(i, i + BATCH);
    const { data, error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) {
      failed += chunk.length;
    } else {
      removed += data?.length ?? chunk.length;
    }
  }
  return { removed, failed };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_TO_KEEP);
  const cutoffIso = cutoff.toISOString();
  const cutoffDate = cutoffIso.slice(0, 10);

  const result = {
    submissions: { records: 0, removed: 0, failed: 0 },
    topics: { topics: 0, removed: 0, failed: 0 },
  };

  // 1) qt-submissions
  const { data: records } = await supabase
    .from("quest_records")
    .select("id, photo_url")
    .eq("type", "qt")
    .not("photo_url", "is", null)
    .lt("created_at", cutoffIso);

  if (records && records.length > 0) {
    const paths: string[] = [];
    const ids: string[] = [];
    for (const r of records as { id: string; photo_url: string }[]) {
      const p = extractStoragePath(r.photo_url, "qt-submissions");
      if (p) {
        paths.push(p);
        ids.push(r.id);
      }
    }
    result.submissions.records = ids.length;
    const { removed, failed } = await removeInBatches(supabase, "qt-submissions", paths);
    result.submissions.removed = removed;
    result.submissions.failed = failed;

    const BATCH_DB = 500;
    for (let i = 0; i < ids.length; i += BATCH_DB) {
      const chunk = ids.slice(i, i + BATCH_DB);
      await supabase.from("quest_records").update({ photo_url: null }).in("id", chunk);
    }
  }

  // 2) qt-topics
  const { data: topics } = await supabase
    .from("qt_topics")
    .select("id, image_urls")
    .lt("date", cutoffDate);

  if (topics && topics.length > 0) {
    const paths: string[] = [];
    const topicIds: string[] = [];
    for (const t of topics as { id: string; image_urls: string[] | null }[]) {
      const urls = t.image_urls || [];
      const tp = urls
        .map((u) => extractStoragePath(u, "qt-topics"))
        .filter((p): p is string => Boolean(p));
      if (tp.length > 0) {
        paths.push(...tp);
        topicIds.push(t.id);
      }
    }
    result.topics.topics = topicIds.length;
    const { removed, failed } = await removeInBatches(supabase, "qt-topics", paths);
    result.topics.removed = removed;
    result.topics.failed = failed;

    const BATCH_DB = 500;
    for (let i = 0; i < topicIds.length; i += BATCH_DB) {
      const chunk = topicIds.slice(i, i + BATCH_DB);
      await supabase.from("qt_topics").update({ image_urls: [] }).in("id", chunk);
    }
  }

  return NextResponse.json({ ok: true, cutoff: cutoffIso, result });
}
