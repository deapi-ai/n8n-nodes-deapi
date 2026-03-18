import type { INodeProperties } from 'n8n-workflow';

import * as cloneVoice from './cloneVoice.operation';
import * as generateSpeech from './generateSpeech.operation';
import * as transcribe from './transcribe.operation';

export { cloneVoice, generateSpeech, transcribe };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Clone a Voice',
				value: 'cloneVoice',
				action: 'Clone a voice',
				description: 'Clones a voice from a reference audio and generates speech',
			},
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
		default: 'cloneVoice',
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
	},
	...cloneVoice.description,
	...generateSpeech.description,
	...transcribe.description,
];
