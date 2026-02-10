import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import {
  sendAccessRequestConfirmation,
  notifySupportNewAccessRequest,
} from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));

  const rawEmail = body?.email;
  const rawName = body?.name;
  const rawOrg = body?.org;
  const rawMessage = body?.message;

  if (!rawEmail || typeof rawEmail !== "string") {
    return NextResponse.json(
      { ok: false, error: "Email required" },
      { status: 400 }
    );
  }

  const normalizedEmail = rawEmail.toLowerCase().trim();
  const normalizedName =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : "there";
  const normalizedOrg =
    typeof rawOrg === "string" && rawOrg.trim().length > 0
      ? rawOrg.trim()
      : undefined;
  const normalizedMessage =
    typeof rawMessage === "string" && rawMessage.trim().length > 0
      ? rawMessage.trim()
      : null;

  // Store the request
  const insert = await dbQuery<{ id: string }>(
    `insert into access_requests (request_email, request_name, request_org, request_message)
     values ($1, $2, $3, $4)
     returning id`,
    [
      normalizedEmail,
      typeof rawName === "string" ? rawName : null,
      typeof rawOrg === "string" ? rawOrg : null,
      normalizedMessage,
    ]
  );

  const requestId = insert.rows?.[0]?.id;

  // User confirmation (matches lib/email.ts signature)
  const confirm = await sendAccessRequestConfirmation({
    to: normalizedEmail,
    name: normalizedName,
    company: normalizedOrg,
  });

  const confirmProviderId =
    (confirm as any)?.result?.data?.id ??
    (confirm as any)?.result?.id ??
    null;

  await dbQuery(
    `insert into email_audit_log (email_type, recipient, provider_message_id)
     values ($1, $2, $3)`,
    ["access_request_confirmation", normalizedEmail, confirmProviderId]
  );

  // Support notification (matches lib/email.ts signature)
  const notify = await notifySupportNewAccessRequest({
    email: normalizedEmail,
    name: normalizedName,
    company: normalizedOrg,
    message: normalizedMessage ?? undefined,
  });

  const notifyProviderId =
    (notify as any)?.result?.data?.id ??
    (notify as any)?.result?.id ??
    null;

  await dbQuery(
    `insert into email_audit_log (email_type, recipient, provider_message_id)
     values ($1, $2, $3)`,
    ["access_request_notify_support", "support@precisegovcon.com", notifyProviderId]
  );

  return NextResponse.json({ ok: true, requestId });
}
