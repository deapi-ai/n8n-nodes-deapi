import type { INodeProperties } from 'n8n-workflow';

import * as generate from './generate.operation';
import * as generateFromAudio from './generateFromAudio.operation';
import * as replace from './replace.operation';
import * as transcribe from './transcribe.operation';

export { generate, generateFromAudio, replace, transcribe };

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
				name: 'Generate From Audio',
				value: 'generateFromAudio',
				action: 'Generate from audio',
				description: 'Generates a video conditioned on an audio file and text prompt',
			},
			{
				name: 'Replace Person in Video',
				value: 'replace',
				action: 'Replace person in video',
				description: 'Replaces a person in a video with a character from a reference image',
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
	...generateFromAudio.description,
	...replace.description,
	...transcribe.description,
];
