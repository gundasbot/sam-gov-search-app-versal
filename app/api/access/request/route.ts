import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import {
  sendAccessRequestConfirmation,
  notifySupportNewAccessRequest,
} from "@/lib/email";

export async function POST(req: Request) {
  const { name, email, org, message } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  const insert = await dbQuery<{ id: string }>(
    `insert into access_requests (request_email, request_name, request_org, request_message)
     values ($1, $2, $3, $4)
     returning id`,
    [
      email.toLowerCase(),
      typeof name === "string" ? name : null,
      typeof org === "string" ? org : null,
      typeof message === "string" ? message : null,
    ]
  );

  const requestId = insert.rows[0].id;

  // User confirmation
  const confirm = await sendAccessRequestConfirmation(email, requestId);
  await dbQuery(
    `insert into email_audit_log (email_type, recipient, provider_message_id)
     values ($1, $2, $3)`,
    ["access_request_confirmation", email.toLowerCase(), (confirm as any)?.data?.id ?? null]
  );

  // Support notification
  const notify = await notifySupportNewAccessRequest({
    requestId,
    name,
    email,
    org,
    message,
  });

  await dbQuery(
    `insert into email_audit_log (email_type, recipient, provider_message_id)
     values ($1, $2, $3)`,
    ["access_request_notify_support", "support@precisegovcon.com", (notify as any)?.data?.id ?? null]
  );

  return NextResponse.json({ ok: true, requestId });
}
