import { NextResponse } from "next/server";
import { sendAccessRequestConfirmation } from "@/lib/email";
import { dbQuery } from "@/lib/db";

export async function GET() {
  const to = "YOUR_EMAIL@gmail.com";

  const result = await sendAccessRequestConfirmation(to, "TEST-REQ-EMAIL");

  const messageId = (result as any)?.data?.id ?? null;

  await dbQuery(
    `insert into email_audit_log (email_type, recipient, provider_message_id, status)
     values ($1, $2, $3, $4)`,
    ["test", to.toLowerCase(), messageId, "sent"]
  );

  return NextResponse.json({
    ok: true,
    messageId,
  });
}
