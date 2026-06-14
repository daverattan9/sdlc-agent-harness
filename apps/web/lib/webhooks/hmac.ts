import crypto from 'crypto';

/**
 * Validates a webhook HMAC-SHA256 signature.
 * @param payload - Raw request body as a string or Buffer
 * @param signature - Signature from webhook header (format: "sha256=<hex>")
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export function validateHmac(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

/**
 * Validates an ElevenLabs webhook signature.
 * ElevenLabs uses: `ElevenLabs-Signature: t=<timestamp>,v1=<hmac>`
 * Signed payload is: "<timestamp>.<body>"
 */
export function validateElevenLabsSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  // Parse header: "t=1234567890,v1=abc123..."
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const idx = p.indexOf('=');
      return [p.slice(0, idx), p.slice(idx + 1)] as [string, string];
    })
  );
  const timestamp = parts['t'];
  const v1 = parts['v1'];

  if (!timestamp || !v1) return false;

  // Check timestamp within tolerance (replay attack prevention)
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  return validateHmac(signedPayload, `sha256=${v1}`, secret);
}
