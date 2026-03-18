import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import type { VoiceCloneRequest } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';

const properties: INodeProperties[] = [
	{
		displayName: 'Text Input',
		name: 'text',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Hello, welcome to our service.',
		description: 'The text to generate speech for',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: 'Language',
		name: 'lang',
		type: 'options',
		required: true,
		default: 'English',
		description: 'Language for speech synthesis',
		options: [
			{ name: 'Chinese', value: 'Chinese' },
			{ name: 'English', value: 'English' },
			{ name: 'French', value: 'French' },
			{ name: 'German', value: 'German' },
			{ name: 'Italian', value: 'Italian' },
			{ name: 'Japanese', value: 'Japanese' },
			{ name: 'Korean', value: 'Korean' },
			{ name: 'Portuguese', value: 'Portuguese' },
			{ name: 'Russian', value: 'Russian' },
			{ name: 'Spanish', value: 'Spanish' },
		],
	},
	{
		displayName: 'Reference Audio',
		name: 'refAudio',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		description:
			'The name of the binary field containing the reference audio file. Supported formats: MP3, WAV, FLAC, OGG, M4A. Max 10 MB. Duration must be between 3-10 seconds.',
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Reference Transcription',
				name: 'refText',
				type: 'string',
				default: '',
				placeholder: 'e.g. The exact words spoken in the reference audio.',
				description:
					'Optional transcript of the reference audio for improved voice cloning accuracy',
				typeOptions: {
					rows: 2,
				},
			},
			{
				displayName: 'Response Format',
				name: 'format',
				type: 'options',
				description: 'Audio output format',
				default: 'mp3',
				options: [
					{ name: 'FLAC', value: 'flac' },
					{ name: 'MP3', value: 'mp3' },
					{ name: 'WAV', value: 'wav' },
				],
			},
			{
				displayName: 'Wait Timeout',
				name: 'waitTimeout',
				type: 'number',
				description: 'Maximum time to wait for completion in seconds',
				default: 120,
				typeOptions: {
					minValue: 30,
					maxValue: 600,
					numberPrecision: 0,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['cloneVoice'],
		resource: ['audio'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const text = this.getNodeParameter('text', i) as string;
	const lang = this.getNodeParameter('lang', i) as string;
	const refAudio = this.getNodeParameter('refAudio', i) as string;
	const options = this.getNodeParameter('options', i);

	const refText = (options.refText as string | undefined) ?? '';
	const format = (options.format as string | undefined) ?? 'mp3';
	const waitTimeout = (options.waitTimeout as number | undefined) ?? 120;

	// Calculate wait time (convert seconds to milliseconds)
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	// Put execution to wait FIRST - this registers the waiting webhook
	await this.putExecutionToWait(waitTill);

	// Construct the webhook URL for deAPI to call back
	const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;
	const webhookUrl = `${resumeUrl}/webhook`;

	// Get the reference audio binary data
	const { fileContent, contentType, filename } = await getBinaryDataFile(this, i, refAudio);

	// Build the form-data request
	const request: VoiceCloneRequest = {
		text,
		model: 'Qwen3_TTS_12Hz_1_7B_Base',
		mode: 'voice_clone',
		lang,
		speed: 1,
		format,
		sample_rate: 24000,
		ref_audio: {
			filename: filename || 'audio',
			contentType,
			content: fileContent,
		},
		ref_text: refText || null,
		webhook_url: webhookUrl,
	};

	const boundary = `----n8nFormBoundary${Date.now()}`;
	const body = generateFormdataBody(boundary, request);

	// Submit the request to deAPI
	await apiRequest.call(this, 'POST', '/txt2audio', {
		headers: {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
		},
		option: {
			body,
			json: false,
		},
	});

	// Return the current input data
	// When the webhook is called, the webhook() method will provide the actual output
	return [
		{
			...this.getInputData()[i],
			pairedItem: { item: i },
		},
	];
}
