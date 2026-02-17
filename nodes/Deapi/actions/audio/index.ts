import type { INodeProperties } from 'n8n-workflow';

import * as transcribe from './transcribe.operation';

export { transcribe };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Transcribe an Audio',
				value: 'transcribe',
				action: 'Transcribe an audio',
				description: 'Transcribes an audio file to text',
			},
		],
		default: 'transcribe',
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
	},
	...transcribe.description,
];
