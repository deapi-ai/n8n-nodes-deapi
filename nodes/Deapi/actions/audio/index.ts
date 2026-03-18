import type { INodeProperties } from 'n8n-workflow';

import * as generateSpeech from './generateSpeech.operation';
import * as transcribe from './transcribe.operation';

export { generateSpeech, transcribe };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Generate a Speech',
				value: 'generateSpeech',
				action: 'Generate a speech',
				description: 'Converts text to speech audio',
			},
			{
				name: 'Transcribe an Audio',
				value: 'transcribe',
				action: 'Transcribe an audio',
				description: 'Transcribes an audio file to text',
			},
		],
		default: 'generateSpeech',
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
	},
	...generateSpeech.description,
	...transcribe.description,
];
