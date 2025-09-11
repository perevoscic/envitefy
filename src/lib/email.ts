import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

type NonEmptyString = string & { _brand: "NonEmptyString" };

function assertEnv(name: string, value: string | undefined): asserts value is NonEmptyString {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not set`);
  }
}

let sesClient: any = null;
function getSes(): any {
  if (!sesClient) {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    sesClient = new SESv2Client({ region });
  }
  return sesClient;
}

export async function sendGiftEmail(params: {
  toEmail: string;
  recipientName?: string | null;
  fromEmail?: string | null; // optional reply-to
  giftCode: string;
  quantity: number;
  period: "months" | "years";
  message?: string | null;
}): Promise<void> {
  assertEnv("SES_FROM_EMAIL", process.env.SES_FROM_EMAIL);
  const from = process.env.SES_FROM_EMAIL as string;
  const to = params.toEmail;

  const subject = `You've received a Snap My Date gift`;
  const months = params.period === "years" ? params.quantity * 12 : params.quantity;
  const preheader = `You've been gifted ${months} month${months === 1 ? "" : "s"} of Snap My Date.`;
  const text = [
    `Hi${params.recipientName ? ` ${params.recipientName}` : ""},`,
    "",
    preheader,
    "",
    `Your gift code: ${params.giftCode}`,
    "",
    params.message ? `Message: ${params.message}` : "",
    "",
    "Redeem here: https://snapmydate.com/subscription (Redeem a Snap)",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!doctype html>
  <html><body>
  <p>Hi${params.recipientName ? ` ${params.recipientName}` : ""},</p>
  <p>${preheader}</p>
  <p><strong>Your gift code:</strong> <code>${params.giftCode}</code></p>
  ${params.message ? `<p><em>Message:</em> ${escapeHtml(params.message)}</p>` : ""}
  <p><a href="https://snapmydate.com/subscription">Redeem your gift</a> (click "Redeem a Snap").</p>
  </body></html>`;

  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: text },
          Html: { Data: html },
        },
      },
    },
    ReplyToAddresses: params.fromEmail ? [params.fromEmail] : undefined,
  });
  await getSes().send(cmd);
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


