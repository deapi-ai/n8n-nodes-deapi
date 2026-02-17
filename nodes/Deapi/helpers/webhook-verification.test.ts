import * as crypto from 'crypto';
import { verifyWebhookSignature } from './webhook-verification';

describe('verifyWebhookSignature', () => {
	const secret = 'test-webhook-secret';
	const rawBody = '{"event":"job.completed","data":{"result_url":"https://example.com/file.png"}}';

	function generateSignature(timestamp: string, body: string, webhookSecret: string): string {
		const message = `${timestamp}.${body}`;
		return 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(message).digest('hex');
	}

	function nowSeconds(): number {
		return Math.floor(Date.now() / 1000);
	}

	describe('valid signatures', () => {
		it.each([
			['current timestamp', 0],
			['4 minutes ago', -240],
			['1 minute in future', 60],
		])('returns true for %s', (_, offsetSeconds) => {
			const timestamp = String(nowSeconds() + offsetSeconds);
			const signature = generateSignature(timestamp, rawBody, secret);
			expect(verifyWebhookSignature(secret, signature, timestamp, rawBody)).toBe(true);
		});
	});

	describe('invalid signatures', () => {
		it.each([
			[
				'incorrect signature',
				'sha256=0000000000000000000000000000000000000000000000000000000000000000',
			],
			['undefined signature', undefined],
			['empty signature', ''],
			['short signature', 'sha256=abc'],
			[
				'uppercase signature',
				() => generateSignature(String(nowSeconds()), rawBody, secret).toUpperCase(),
			],
		])('returns false for %s', (_, signature) => {
			const timestamp = String(nowSeconds());
			const sig = typeof signature === 'function' ? signature() : signature;
			expect(verifyWebhookSignature(secret, sig, timestamp, rawBody)).toBe(false);
		});

		it('returns false for wrong secret', () => {
			const timestamp = String(nowSeconds());
			const signature = generateSignature(timestamp, rawBody, 'wrong-secret');
			expect(verifyWebhookSignature(secret, signature, timestamp, rawBody)).toBe(false);
		});

		it('returns false for tampered body', () => {
			const timestamp = String(nowSeconds());
			const signature = generateSignature(timestamp, rawBody, secret);
			expect(verifyWebhookSignature(secret, signature, timestamp, '{"tampered":true}')).toBe(false);
		});
	});

	describe('timestamp validation', () => {
		it.each([
			['5 min 1 sec ago', -301],
			['5 min 1 sec in future', 301],
		])('returns false for timestamp %s', (_, offsetSeconds) => {
			const timestamp = String(nowSeconds() + offsetSeconds);
			const signature = generateSignature(timestamp, rawBody, secret);
			expect(verifyWebhookSignature(secret, signature, timestamp, rawBody)).toBe(false);
		});

		it.each([
			['undefined', undefined],
			['empty string', ''],
			['invalid number', 'invalid'],
		])('returns false when timestamp is %s', (_, timestamp) => {
			expect(verifyWebhookSignature(secret, 'sha256=any', timestamp, rawBody)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it.each([
			['empty body', ''],
			['special characters', '{"text":"Hello\\nWorld\\t\\"Quotes\\""}'],
			['unicode characters', '{"text":"Hello 世界 🌍"}'],
		])('handles %s', (_, body) => {
			const timestamp = String(nowSeconds());
			const signature = generateSignature(timestamp, body, secret);
			expect(verifyWebhookSignature(secret, signature, timestamp, body)).toBe(true);
		});
	});
});
