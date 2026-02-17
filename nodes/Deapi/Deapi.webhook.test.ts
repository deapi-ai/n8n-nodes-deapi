import * as crypto from 'crypto';
import type { IBinaryData, IWebhookFunctions } from 'n8n-workflow';
import { mockDeep } from 'jest-mock-extended';
import { Deapi } from './Deapi.node';

function generateSignature(timestamp: string, body: string, secret: string): string {
	const message = `${timestamp}.${body}`;
	return 'sha256=' + crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

describe('Deapi webhook handler', () => {
	const secret = 'test-webhook-secret';
	const deapi = new Deapi();

	function createWebhookMock(event: string, data: Record<string, unknown> = {}) {
		const body = { event, data };
		const rawBody = JSON.stringify(body);
		const timestamp = String(nowSeconds());
		const signature = generateSignature(timestamp, rawBody, secret);

		const mock = mockDeep<IWebhookFunctions>();
		const statusMock = jest.fn().mockReturnValue({ send: jest.fn() });
		mock.getResponseObject.mockReturnValue({ status: statusMock } as never);
		mock.getCredentials.mockResolvedValue({ webhookSecret: secret });
		mock.getHeaderData.mockReturnValue({
			'x-deapi-signature': signature,
			'x-deapi-timestamp': timestamp,
		} as never);
		mock.getRequestObject.mockReturnValue({ rawBody, body } as never);

		return { mock, statusMock };
	}

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('signature verification', () => {
		it('should return 401 for invalid signature', async () => {
			const body = { event: 'job.completed', data: {} };
			const rawBody = JSON.stringify(body);
			const timestamp = String(nowSeconds());

			const mock = mockDeep<IWebhookFunctions>();
			const sendMock = jest.fn();
			const statusMock = jest.fn().mockReturnValue({ send: sendMock });
			mock.getResponseObject.mockReturnValue({ status: statusMock } as never);
			mock.getCredentials.mockResolvedValue({ webhookSecret: secret });
			mock.getHeaderData.mockReturnValue({
				'x-deapi-signature': 'sha256=invalid',
				'x-deapi-timestamp': timestamp,
			} as never);
			mock.getRequestObject.mockReturnValue({ rawBody, body } as never);

			const result = await deapi.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(401);
			expect(sendMock).toHaveBeenCalledWith('Invalid signature');
			expect(result).toEqual({ noWebhookResponse: true });
		});

		it('should return 401 for missing signature header', async () => {
			const body = { event: 'job.completed', data: {} };
			const rawBody = JSON.stringify(body);

			const mock = mockDeep<IWebhookFunctions>();
			const sendMock = jest.fn();
			const statusMock = jest.fn().mockReturnValue({ send: sendMock });
			mock.getResponseObject.mockReturnValue({ status: statusMock } as never);
			mock.getCredentials.mockResolvedValue({ webhookSecret: secret });
			mock.getHeaderData.mockReturnValue({
				'x-deapi-timestamp': String(nowSeconds()),
			} as never);
			mock.getRequestObject.mockReturnValue({ rawBody, body } as never);

			const result = await deapi.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(401);
			expect(result).toEqual({ noWebhookResponse: true });
		});

		it('should return 401 for missing timestamp header', async () => {
			const body = { event: 'job.completed', data: {} };
			const rawBody = JSON.stringify(body);

			const mock = mockDeep<IWebhookFunctions>();
			const sendMock = jest.fn();
			const statusMock = jest.fn().mockReturnValue({ send: sendMock });
			mock.getResponseObject.mockReturnValue({ status: statusMock } as never);
			mock.getCredentials.mockResolvedValue({ webhookSecret: secret });
			mock.getHeaderData.mockReturnValue({
				'x-deapi-signature': 'sha256=something',
			} as never);
			mock.getRequestObject.mockReturnValue({ rawBody, body } as never);

			const result = await deapi.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(401);
			expect(result).toEqual({ noWebhookResponse: true });
		});
	});

	describe('job.processing event', () => {
		it('should return noWebhookResponse true and not resume execution', async () => {
			const { mock, statusMock } = createWebhookMock('job.processing');

			const result = await deapi.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(result).toEqual({ noWebhookResponse: true });
			expect(result).not.toHaveProperty('workflowData');
		});
	});

	describe('job.completed event', () => {
		it('should download binary and return workflowData when result_url is present', async () => {
			const resultUrl = 'https://storage.deapi.ai/results/image.png';
			const { mock, statusMock } = createWebhookMock('job.completed', {
				result_url: resultUrl,
				job_request_id: 'req_123',
			});

			const preparedBinaryData = {
				data: 'base64-data',
				mimeType: 'image/png',
				fileName: 'image.png',
			} as IBinaryData;
			mock.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('image-bytes'),
				headers: { 'content-type': 'image/png' },
			});
			mock.helpers.prepareBinaryData.mockResolvedValue(preparedBinaryData);

			const result = await deapi.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(result.workflowData).toBeDefined();
			expect(result.workflowData![0][0].binary).toEqual({ data: preparedBinaryData });
			expect(result.workflowData![0][0].json).toEqual({});
		});

		it('should return JSON data when result_url is not present', async () => {
			const { mock, statusMock } = createWebhookMock('job.completed', {
				job_request_id: 'req_456',
				status: 'done',
			});

			const result = await deapi.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(result.workflowData).toBeDefined();
			expect(result.workflowData![0][0].json).toEqual({
				event: 'job.completed',
				data: {
					job_request_id: 'req_456',
					status: 'done',
				},
			});
			expect(result.workflowData![0][0]).not.toHaveProperty('binary');
		});
	});

	describe('job.failed event', () => {
		it('should return error data as JSON', async () => {
			const { mock, statusMock } = createWebhookMock('job.failed', {
				job_request_id: 'req_789',
				error_code: 'ERR_001',
				error_message: 'Generation failed',
			});

			const result = await deapi.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(result.workflowData).toBeDefined();
			expect(result.workflowData![0][0].json).toEqual({
				event: 'job.failed',
				data: {
					job_request_id: 'req_789',
					error_code: 'ERR_001',
					error_message: 'Generation failed',
				},
			});
		});
	});
});
