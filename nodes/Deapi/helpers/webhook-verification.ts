import * as crypto from 'crypto';

/**
 * Verifies the HMAC-SHA256 signature of a deAPI webhook request.
 *
 * @param secret - The webhook secret from credentials
 * @param signature - The X-DeAPI-Signature header value
 * @param timestamp - The X-DeAPI-Timestamp header value
 * @param rawBody - The raw request body string
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
	secret: string,
	signature: string | undefined,
	timestamp: string | undefined,
	rawBody: string,
): boolean {
	// Reject empty or missing secret
	if (!secret) {
		return false;
	}

	// Verify timestamp is within 5 minutes
	const now = Math.floor(Date.now() / 1000);
	if (!timestamp || Math.abs(now - parseInt(timestamp)) > 300) {
		return false;
	}

	// Calculate expected signature
	const message = `${timestamp}.${rawBody}`;
	const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(message).digest('hex');

	// Verify signature exists and has correct length
	if (!signature || signature.length !== expected.length) {
		return false;
	}

	// Timing-safe comparison
	if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
		return false;
	}

	return true;
}
