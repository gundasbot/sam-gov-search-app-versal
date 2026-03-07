import crypto from "crypto"

const TTL_MIN = Number(process.env.RESET_TOKEN_TTL_MINUTES || "30")

export function createResetToken() {
  const raw = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex")
  const expiresAt = new Date(Date.now() + TTL_MIN * 60 * 1000)
  return { raw, tokenHash, expiresAt }
}

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex")
}
