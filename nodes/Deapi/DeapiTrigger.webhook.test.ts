import * as crypto from 'crypto';
import type { IBinaryData, IWebhookFunctions } from 'n8n-workflow';
import { mockDeep } from 'jest-mock-extended';
import { DeapiTrigger } from './DeapiTrigger.node';

function generateSignature(timestamp: string, body: string, secret: string): string {
	const message = `${timestamp}.${body}`;
	return 'sha256=' + crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

describe('DeapiTrigger webhook handler', () => {
	const secret = 'test-webhook-secret';
	const trigger = new DeapiTrigger();

	function createWebhookMock(
		event: string,
		data: Record<string, unknown> = {},
		options: {
			selectedEvents?: string[];
			downloadBinary?: boolean;
		} = {},
	) {
		const { selectedEvents = ['jobCompleted'], downloadBinary = true } = options;
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
		mock.getNodeParameter.mockImplementation((param: string) => {
			if (param === 'events') return selectedEvents;
			if (param === 'downloadBinary') return downloadBinary;
			return undefined;
		});
		mock.helpers.returnJsonArray.mockImplementation((items) => {
			if (Array.isArray(items)) {
				return items.map((item) => ({ json: item }));
			}
			return [{ json: items }];
		});

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

			const result = await trigger.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(401);
			expect(sendMock).toHaveBeenCalledWith('Invalid signature');
			expect(result).toEqual({ noWebhookResponse: true });
		});
	});

	describe('event filtering', () => {
		it('should trigger workflow when event matches selected filter', async () => {
			const { mock } = createWebhookMock(
				'job.completed',
				{ result_url: 'https://example.com/file.png' },
				{ selectedEvents: ['jobCompleted'], downloadBinary: false },
			);

			const result = await trigger.webhook.call(mock);

			expect(result.workflowData).toBeDefined();
		});

		it('should not trigger workflow when event does not match selected filter', async () => {
			const { mock, statusMock } = createWebhookMock(
				'job.processing',
				{},
				{ selectedEvents: ['jobCompleted', 'jobFailed'] },
			);

			const result = await trigger.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(result).toEqual({ noWebhookResponse: true });
		});

		it('should trigger for job.processing when selected', async () => {
			const { mock } = createWebhookMock(
				'job.processing',
				{ job_request_id: 'req_123' },
				{ selectedEvents: ['jobProcessing'] },
			);

			const result = await trigger.webhook.call(mock);

			expect(result.workflowData).toBeDefined();
		});

		it('should trigger for job.failed when selected', async () => {
			const { mock } = createWebhookMock(
				'job.failed',
				{ error_code: 'ERR_001', error_message: 'Failed' },
				{ selectedEvents: ['jobFailed'] },
			);

			const result = await trigger.webhook.call(mock);

			expect(result.workflowData).toBeDefined();
		});

		it('should ignore unknown events', async () => {
			const { mock, statusMock } = createWebhookMock(
				'job.unknown',
				{},
				{ selectedEvents: ['jobCompleted', 'jobProcessing', 'jobFailed'] },
			);

			const result = await trigger.webhook.call(mock);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(result).toEqual({ noWebhookResponse: true });
		});
	});

	describe('download binary toggle', () => {
		it('should download binary when downloadBinary is true and result_url is present', async () => {
			const resultUrl = 'https://storage.deapi.ai/results/image.png';
			const { mock } = createWebhookMock(
				'job.completed',
				{ result_url: resultUrl },
				{ selectedEvents: ['jobCompleted'], downloadBinary: true },
			);

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

			const result = await trigger.webhook.call(mock);

			expect(result.workflowData).toBeDefined();
			expect(result.workflowData![0][0].binary).toEqual({ data: preparedBinaryData });
			expect(result.workflowData![0][0].json).toEqual({ result_url: resultUrl });
		});

		it('should return JSON when downloadBinary is false', async () => {
			const { mock } = createWebhookMock(
				'job.completed',
				{ result_url: 'https://example.com/file.png' },
				{ selectedEvents: ['jobCompleted'], downloadBinary: false },
			);

			const result = await trigger.webhook.call(mock);

			expect(result.workflowData).toBeDefined();
			expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it('should return JSON when downloadBinary is true but no result_url', async () => {
			const { mock } = createWebhookMock(
				'job.completed',
				{ job_request_id: 'req_123', status: 'done' },
				{ selectedEvents: ['jobCompleted'], downloadBinary: true },
			);

			const result = await trigger.webhook.call(mock);

			expect(result.workflowData).toBeDefined();
			expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});
});
