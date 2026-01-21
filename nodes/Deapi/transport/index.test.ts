import type { IExecuteFunctions } from 'n8n-workflow';
import { mockDeep } from 'jest-mock-extended';
import { apiRequest } from '.';

describe('deAPI transport', () => {
  const executeFunctionsMock = mockDeep<IExecuteFunctions>();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call httpRequestWithAuthentication with correct parameters', async () => {
    
    await apiRequest.call(executeFunctionsMock, 'GET', '/models', {
			headers: {
        'Accept': 'application/json',
			},
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
        headers: {
          'Accept': 'application/json',
        },
      },
    );
  });
});