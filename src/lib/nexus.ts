const NEXUS_URL = "https://nexus-dashboard-1031219092203.us-central1.run.app/api/events";
const APP_ID = "testimonial-uploader";

type MetaValue = string | number | boolean | null;
type Meta = Record<string, MetaValue>;

let warnedMissingKey = false;

export async function trackEvent(event: string, meta?: Meta): Promise<void> {
  const key = process.env.NEXUS_INGEST_KEY;
  if (!key) {
    if (!warnedMissingKey) {
      console.warn("[nexus] NEXUS_INGEST_KEY is not set — skipping event tracking");
      warnedMissingKey = true;
    }
    return;
  }

  const body: { appId: string; event: string; meta?: Meta } = { appId: APP_ID, event };
  if (meta && Object.keys(meta).length > 0) body.meta = meta;

  const send = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      return await fetch(NEXUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Nexus-Key": key },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let res = await send();
    if (res.status >= 500) {
      await new Promise((r) => setTimeout(r, 250));
      res = await send();
    }
    if (!res.ok) {
      console.warn(`[nexus] trackEvent ${event} failed: ${res.status}`);
    }
  } catch (err) {
    console.warn(`[nexus] trackEvent ${event} threw:`, err);
  }
}
