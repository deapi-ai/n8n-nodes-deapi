import type { IExecuteFunctions } from 'n8n-workflow';
import { mockDeep } from 'jest-mock-extended';
import { apiRequest } from './index';

describe('deAPI transport', () => {
	const executeFunctionsMock = mockDeep<IExecuteFunctions>();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call httpRequestWithAuthentication with correct parameters', async () => {
		await apiRequest.call(executeFunctionsMock, 'GET', '/models', {
			qs: {
				per_page: 15,
				page: 1,
			},
		});

		expect(executeFunctionsMock.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'deApi',
			{
				method: 'GET',
				url: 'https://api.deapi.ai/api/v1/client/models',
				json: true,
				qs: {
					per_page: 15,
					page: 1,
				},
			},
		);
	});

	it('should override the values with `option`', async () => {
		await apiRequest.call(executeFunctionsMock, 'GET', '', {
			option: {
				url: 'https://example.com/override',
				returnFullResponse: true,
			},
		});

		expect(executeFunctionsMock.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'deApi',
			{
				method: 'GET',
				url: 'https://example.com/override',
				json: true,
				returnFullResponse: true,
			},
		);
	});

	it('should pass POST body correctly', async () => {
		await apiRequest.call(executeFunctionsMock, 'POST', '/jobs', {
			body: {
				prompt: 'A beautiful sunset',
				model: 'flux-dev',
			},
		});

		expect(executeFunctionsMock.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'deApi',
			{
				method: 'POST',
				url: 'https://api.deapi.ai/api/v1/client/jobs',
				json: true,
				body: {
					prompt: 'A beautiful sunset',
					model: 'flux-dev',
				},
			},
		);
	});

	it('should merge custom headers', async () => {
		await apiRequest.call(executeFunctionsMock, 'POST', '/jobs', {
			headers: {
				'Content-Type': 'multipart/form-data',
				'X-Custom': 'value',
			},
		});

		expect(executeFunctionsMock.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'deApi',
			{
				method: 'POST',
				url: 'https://api.deapi.ai/api/v1/client/jobs',
				json: true,
				headers: {
					'Content-Type': 'multipart/form-data',
					'X-Custom': 'value',
				},
			},
		);
	});

	it('should return custom message for 429 rate limit error', async () => {
		const rateLimitError = new Error('Too Many Requests') as Error & { httpCode: string };
		rateLimitError.httpCode = '429';
		executeFunctionsMock.helpers.httpRequestWithAuthentication.mockRejectedValue(rateLimitError);

		await expect(apiRequest.call(executeFunctionsMock, 'GET', '/models')).rejects.toThrow(
			'Rate limit exceeded. Upgrade to Premium at https://deapi.ai/billing to remove daily caps.',
		);
	});

	it('should re-throw non-429 errors unchanged', async () => {
		const serverError = new Error('Internal Server Error') as Error & { httpCode: string };
		serverError.httpCode = '500';
		executeFunctionsMock.helpers.httpRequestWithAuthentication.mockRejectedValue(serverError);

		await expect(apiRequest.call(executeFunctionsMock, 'GET', '/models')).rejects.toThrow(
			'Internal Server Error',
		);
	});
});
