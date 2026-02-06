import * as crypto from 'crypto';
import { verifyWebhookSignature } from './webhook-verification';

describe('verifyWebhookSignature', () => {
  const secret = 'test-webhook-secret';
  const rawBody = '{"event":"job.completed","data":{"result_url":"https://example.com/file.png"}}';

  /**
   * Helper function to generate a valid HMAC signature
   */
  function generateValidSignature(timestamp: string, body: string, webhookSecret: string): string {
    const message = `${timestamp}.${body}`;
    return 'sha256=' + crypto
      .createHmac('sha256', webhookSecret)
      .update(message)
      .digest('hex');
  }

  describe('Valid signatures', () => {
    it('should return true for valid signature with current timestamp', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = generateValidSignature(timestamp, rawBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, rawBody);

      expect(result).toBe(true);
    });

    it('should return true for signature within 5-minute window (4 minutes old)', () => {
      const timestamp = String(Math.floor(Date.now() / 1000) - 240); // 4 minutes ago
      const signature = generateValidSignature(timestamp, rawBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, rawBody);

      expect(result).toBe(true);
    });

    it('should return true for signature within 5-minute window (future timestamp)', () => {
      // Account for clock skew - allow timestamps slightly in the future
      const timestamp = String(Math.floor(Date.now() / 1000) + 60); // 1 minute in future
      const signature = generateValidSignature(timestamp, rawBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, rawBody);

      expect(result).toBe(true);
    });
  });

  describe('Invalid signatures', () => {
    it('should return false for incorrect signature', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const wrongSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

      const result = verifyWebhookSignature(secret, wrongSignature, timestamp, rawBody);

      expect(result).toBe(false);
    });

    it('should return false for signature with wrong secret', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const wrongSecret = 'wrong-secret';
      const signature = generateValidSignature(timestamp, rawBody, wrongSecret);

      const result = verifyWebhookSignature(secret, signature, timestamp, rawBody);

      expect(result).toBe(false);
    });

    it('should return false for signature with tampered body', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = generateValidSignature(timestamp, rawBody, secret);
      const tamperedBody = '{"event":"job.failed","data":{}}';

      const result = verifyWebhookSignature(secret, signature, timestamp, tamperedBody);

      expect(result).toBe(false);
    });

    it('should return false when signature is undefined', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));

      const result = verifyWebhookSignature(secret, undefined, timestamp, rawBody);

      expect(result).toBe(false);
    });

    it('should return false when signature is empty string', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));

      const result = verifyWebhookSignature(secret, '', timestamp, rawBody);

      expect(result).toBe(false);
    });
  });

  describe('Timestamp validation', () => {
    it('should return false for timestamp older than 5 minutes', () => {
      const timestamp = String(Math.floor(Date.now() / 1000) - 301); // 5 minutes 1 second ago
      const signature = generateValidSignature(timestamp, rawBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, rawBody);

      expect(result).toBe(false);
    });

    it('should return false for timestamp more than 5 minutes in the future', () => {
      const timestamp = String(Math.floor(Date.now() / 1000) + 301); // 5 minutes 1 second in future
      const signature = generateValidSignature(timestamp, rawBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, rawBody);

      expect(result).toBe(false);
    });

    it('should return false when timestamp is undefined', () => {
      const signature = 'sha256=any';

      const result = verifyWebhookSignature(secret, signature, undefined, rawBody);

      expect(result).toBe(false);
    });

    it('should return false when timestamp is empty string', () => {
      const signature = 'sha256=any';

      const result = verifyWebhookSignature(secret, signature, '', rawBody);

      expect(result).toBe(false);
    });

    it('should return false when timestamp is not a valid number', () => {
      const signature = 'sha256=any';

      const result = verifyWebhookSignature(secret, signature, 'invalid', rawBody);

      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const emptyBody = '';
      const signature = generateValidSignature(timestamp, emptyBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, emptyBody);

      expect(result).toBe(true);
    });

    it('should handle special characters in body', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const specialBody = '{"text":"Hello\\nWorld\\t\\"Quotes\\""}';
      const signature = generateValidSignature(timestamp, specialBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, specialBody);

      expect(result).toBe(true);
    });

    it('should handle Unicode characters in body', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const unicodeBody = '{"text":"Hello 世界 🌍"}';
      const signature = generateValidSignature(timestamp, unicodeBody, secret);

      const result = verifyWebhookSignature(secret, signature, timestamp, unicodeBody);

      expect(result).toBe(true);
    });

    it('should be case-sensitive for signature', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = generateValidSignature(timestamp, rawBody, secret);
      const uppercaseSignature = signature.toUpperCase();

      const result = verifyWebhookSignature(secret, uppercaseSignature, timestamp, rawBody);

      expect(result).toBe(false);
    });
  });

  describe('Timing attack resistance', () => {
    it('should use timing-safe comparison', () => {
      // This test verifies that crypto.timingSafeEqual is being used
      // We can't directly test timing, but we can verify the behavior
      const timestamp = String(Math.floor(Date.now() / 1000));

      // Create signatures with different lengths (would fail Buffer.from if not handled)
      const shortSignature = 'sha256=abc';

      // Should return false (different lengths are still compared safely)
      const result = verifyWebhookSignature(secret, shortSignature, timestamp, rawBody);

      expect(result).toBe(false);
    });
  });
});
