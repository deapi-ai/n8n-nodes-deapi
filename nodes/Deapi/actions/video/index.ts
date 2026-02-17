import type { INodeProperties } from 'n8n-workflow';

import * as generate from './generate.operation';
import * as transcribe from './transcribe.operation';

export { generate, transcribe };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Generate a Video',
				value: 'generate',
				action: 'Generate a video',
				description: 'Generates a video from text prompt or image(s)',
			},
			{
				name: 'Transcribe a Video',
				value: 'transcribe',
				action: 'Transcribe a video',
				description: 'Transcribes audio from a video to text',
			},
		],
		default: 'generate',
		displayOptions: {
			show: {
				resource: ['video'],
			},
		},
	},
	...generate.description,
	...transcribe.description,
];
