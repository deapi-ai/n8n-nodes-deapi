import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DeApi implements ICredentialType {
	name = 'deApi';

  // TO REMOVE linter rules, which enforces that API string appended.
	displayName = 'deAPI API';

	documentationUrl = 'https://docs.deapi.ai/quickstart#2-obtain-your-api-key';

  icon: Icon = 'file:deapi.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
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