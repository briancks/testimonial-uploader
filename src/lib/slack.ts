const TIMEOUT_MS = 1500;
const TRANSCRIPT_PREVIEW_CHARS = 240;
const FAILED_TRANSCRIPT = "Transcription failed - manual review needed";

let warnedMissingWebhook = false;

interface NotifyArgs {
  name: string;
  course: string;
  transcript: string;
  adminUrl: string;
}

// Slack mrkdwn requires &, <, > escaped so user-supplied text doesn't break formatting.
function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildPayload({ name, course, transcript, adminUrl }: NotifyArgs) {
  const failed = transcript === FAILED_TRANSCRIPT;
  const transcriptBlock = failed
    ? "_Transcription failed — manual review needed_"
    : transcript.length > TRANSCRIPT_PREVIEW_CHARS
      ? `"${escape(transcript.slice(0, TRANSCRIPT_PREVIEW_CHARS).trim())}…"`
      : `"${escape(transcript)}"`;

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:bust_in_silhouette: New testimonial from *${escape(name)}*`,
        },
      },
      {
        type: "section",
        fields: [{ type: "mrkdwn", text: `*Course:*\n${escape(course)}` }],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Transcript:*\n${transcriptBlock}` },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View in admin" },
            url: adminUrl,
          },
        ],
      },
    ],
  };
}

export async function notifyTestimonialSubmitted(args: NotifyArgs): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    if (!warnedMissingWebhook) {
      console.warn("[slack] SLACK_WEBHOOK_URL is not set — skipping notification");
      warnedMissingWebhook = true;
    }
    return;
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(args)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[slack] notify failed: ${res.status}`);
    }
  } catch (err) {
    console.warn("[slack] notify threw:", err);
  }
}
