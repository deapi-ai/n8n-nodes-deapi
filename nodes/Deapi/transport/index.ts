import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

type RequestParameters = {
	headers?: IDataObject;
	body?: IDataObject | string;
	qs?: IDataObject;
	option?: IDataObject;
};

export async function apiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parameters?: RequestParameters,
) {
	const { body, qs, option, headers } = parameters ?? {};

	const url = `https://api.deapi.ai/api/v1/client${endpoint}`;

	const options = {
		headers,
		method,
		body,
		qs,
		url,
		json: true,
	};

	if (option && Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'deApi', options);
	} catch (error) {
		if (error.httpCode === '429') {
			error.message =
				'Rate limit exceeded. Upgrade to Premium at https://deapi.ai/billing to remove daily caps.';
		}
		throw error;
	}
}
