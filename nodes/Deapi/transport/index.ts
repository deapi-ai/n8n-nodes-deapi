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
  // let headers = parameters?.headers ?? {};

  // const credentials = await this.getCredentials('deApi');

  // if (
	// 	credentials.header &&
	// 	typeof credentials.headerName === 'string' &&
	// 	credentials.headerName &&
	// 	typeof credentials.headerValue === 'string'
	// ) {
	// 	headers = {
	// 		...headers,
	// 		[credentials.headerName]: credentials.headerValue,
	// 	};
	// }

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

  return await this.helpers.httpRequestWithAuthentication.call(this, 'deApi', options);
}