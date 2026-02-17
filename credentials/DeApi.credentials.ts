import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DeApi implements ICredentialType {
	name = 'deApi';

	displayName = 'deAPI API';

	documentationUrl = 'https://docs.deapi.ai/quickstart';

	icon: Icon = 'file:deapi.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'<a href="https://docs.deapi.ai/quickstart#2-obtain-your-api-key" target="_blank">Get your API key</a>',
		},
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Secret to verify signature from deAPI webhooks. <a href="https://deapi.ai/settings/webhooks" target="_blank">Get your webhook secret</a>',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.deapi.ai/api/v1/client',
			url: '/models?per_page=15&page=1',
			headers: {
				Accept: 'application/json',
			},
		},
	};
}
