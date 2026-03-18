import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
	updateDisplayOptions,
} from 'n8n-workflow';

import type { AudioToVideoRequest } from '../../helpers/interfaces';
import type { FormdataFileValue } from '../../helpers/formdata';
import { apiRequest } from '../../transport';
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';

const properties: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		placeholder: 'e.g. A person speaking confidently in a modern office',
		description: 'A text description to guide the video generation alongside the audio',
		default: '',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: 'Binary Field Name for Audio',
		name: 'audioBinaryProperty',
		type: 'string',
		default: 'data',
		required: true,
		placeholder: 'e.g. data',
		description:
			'The name of the binary field containing the audio file. Supported formats: MP3, WAV, OGG, FLAC. Max 20 MB.',
	},
	{
		displayName: 'Ratio',
		name: 'ratio',
		type: 'options',
		description: 'Aspect ratio of the generated video',
		required: true,
		options: [
			{
				name: 'Square',
				value: 'square',
			},
			{
				name: 'Landscape',
				value: 'landscape',
			},
			{
				name: 'Portrait',
				value: 'portrait',
			},
		],
		default: 'square',
		noDataExpression: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Binary Field Name for First Frame Image',
				name: 'firstFrame',
				type: 'string',
				default: 'data1',
				placeholder: 'e.g. data1',
				description: 'The name of the binary field containing the first frame image',
			},
			{
				displayName: 'Binary Field Name for Last Frame Image',
				name: 'lastFrame',
				type: 'string',
				default: 'data2',
				placeholder: 'e.g. data2',
				description: 'The name of the binary field containing the last frame image',
			},
			{
				displayName: 'Frames',
				name: 'frames',
				type: 'number',
				description: 'Number of video frames to generate',
				typeOptions: {
					maxValue: 241,
					minValue: 49,
					numberPrecision: 0,
				},
				default: 120,
			},
			{
				displayName: 'Resolution',
				name: 'squareSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '512x512',
						value: '512x512',
					},
					{
						name: '768x768',
						value: '768x768',
					},
					{
						name: '1024x1024',
						value: '1024x1024',
					},
				],
				displayOptions: {
					show: {
						'/ratio': ['square'],
					},
				},
				default: '768x768',
			},
			{
				displayName: 'Resolution',
				name: 'landscapeSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '1024x576',
						value: '1024x576',
					},
				],
				displayOptions: {
					show: {
						'/ratio': ['landscape'],
					},
				},
				default: '1024x576',
			},
			{
				displayName: 'Resolution',
				name: 'portraitSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '512x640',
						value: '512x640',
					},
					{
						name: '768x960',
						value: '768x960',
					},
				],
				displayOptions: {
					show: {
						'/ratio': ['portrait'],
					},
				},
				default: '768x960',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				description: 'Random seed for generation. By default seed is random.',
				typeOptions: {
					maxValue: 4_294_967_295,
					minValue: -1,
					numberPrecision: 0,
				},
				default: -1,
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
		operation: ['generateFromAudio'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	type Ratio = 'square' | 'landscape' | 'portrait';

	const prompt = this.getNodeParameter('prompt', i) as string;
	const audioBinaryProperty = this.getNodeParameter('audioBinaryProperty', i) as string;
	const ratio = this.getNodeParameter('ratio', i) as Ratio;
	const options = this.getNodeParameter('options', i);

	// Fixed values
	const model = 'Ltx2_3_22B_Dist_INT8';
	const fps = 24;

	// Frames
	const frames = (options.frames as number | undefined) ?? 120;

	// Resolution
	const size = (options.squareSize ?? options.landscapeSize ?? options.portraitSize) as
		| string
		| undefined;

	let width: number, height: number;
	if (size == null) {
		switch (ratio) {
			case 'landscape':
				width = 1024;
				height = 576;
				break;
			case 'portrait':
				width = 768;
				height = 960;
				break;
			case 'square':
			default:
				width = 768;
				height = 768;
				break;
		}
	} else {
		const parts = size.split('x').map(Number);
		width = parts[0];
		height = parts[1];
		if (parts.length !== 2 || !Number.isFinite(width) || !Number.isFinite(height)) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid resolution format: "${size}". Expected "WIDTHxHEIGHT".`,
				{ itemIndex: i },
			);
		}
	}

	// Seed
	let seed = options.seed as number | undefined;
	if (seed == null || seed === -1) {
		seed = Math.floor(Math.random() * 4_294_967_296);
	}

	// Wait Timeout
	const waitTimeout = (options.waitTimeout as number | undefined) ?? 120;
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	await this.putExecutionToWait(waitTill);

	const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;
	const webhookUrl = `${resumeUrl}/webhook`;

	// Audio file (required)
	const {
		fileContent: audioContent,
		contentType: audioContentType,
		filename: audioFilename,
	} = await getBinaryDataFile(this, i, audioBinaryProperty);

	const audioFile: FormdataFileValue = {
		filename: audioFilename || 'audio',
		contentType: audioContentType,
		content: audioContent,
	};

	// First frame image (optional)
	let firstFrameFile: FormdataFileValue | null = null;
	const firstFrame = options.firstFrame as string | undefined;
	if (firstFrame) {
		const { fileContent, contentType, filename } = await getBinaryDataFile(this, i, firstFrame);
		firstFrameFile = { filename: filename || 'first_frame', contentType, content: fileContent };
	}

	// Last frame image (optional)
	let lastFrameFile: FormdataFileValue | null = null;
	const lastFrame = options.lastFrame as string | undefined;
	if (lastFrame) {
		const { fileContent, contentType, filename } = await getBinaryDataFile(this, i, lastFrame);
		lastFrameFile = { filename: filename || 'last_frame', contentType, content: fileContent };
	}

	const request: AudioToVideoRequest = {
		prompt,
		model,
		audio: audioFile,
		width,
		height,
		frames,
		seed,
		fps,
		first_frame_image: firstFrameFile,
		last_frame_image: lastFrameFile,
		webhook_url: webhookUrl,
	};

	const boundary = `----n8nFormBoundary${Date.now()}`;
	const body = generateFormdataBody(boundary, request);

	await apiRequest.call(this, 'POST', '/aud2video', {
		headers: {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
		},
		option: {
			body,
			json: false,
		},
	});

	return [
		{
			...this.getInputData()[i],
			pairedItem: { item: i },
		},
	];
}
