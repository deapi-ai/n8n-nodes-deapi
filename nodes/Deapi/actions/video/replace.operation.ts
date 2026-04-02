import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
	updateDisplayOptions,
} from 'n8n-workflow';

import type { VideoReplaceRequest } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';

const properties: INodeProperties[] = [
	{
		displayName: 'Binary Field Name for Video',
		name: 'videoBinaryProperty',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		description:
			'The name of the binary field containing the video file. Supported formats: MP4, MPEG, QuickTime, AVI, WMV, OGG. Max duration: 8 seconds.',
	},
	{
		displayName: 'Binary Field Name for Reference Image',
		name: 'refImageBinaryProperty',
		type: 'string',
		required: true,
		default: 'data1',
		placeholder: 'e.g. data1',
		description:
			'The name of the binary field containing the reference character image. Supported formats: JPG, JPEG, PNG, GIF, BMP, WebP. Max size: 10 MB.',
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		placeholder: 'e.g. A woman in a red dress walking through a garden',
		description: 'An optional text description to guide the replacement',
		default: '',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: 'Ratio',
		name: 'ratio',
		type: 'options',
		description: 'Aspect ratio of the output video',
		required: true,
		options: [
			{
				name: 'From Input Video',
				value: 'original',
			},
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
		default: 'original',
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
				displayName: 'Resolution',
				name: 'landscapeSize',
				type: 'options',
				description: 'Width and height of the output video in pixels',
				options: [
					{
						name: '852x480',
						value: '852x480',
					},
					{
						name: '768x432',
						value: '768x432',
					},
				],
				displayOptions: {
					show: {
						'/ratio': ['landscape'],
					},
				},
				default: '852x480',
			},
			{
				displayName: 'Resolution',
				name: 'portraitSize',
				type: 'options',
				description: 'Width and height of the output video in pixels',
				options: [
					{
						name: '480x852',
						value: '480x852',
					},
					{
						name: '432x768',
						value: '432x768',
					},
				],
				displayOptions: {
					show: {
						'/ratio': ['portrait'],
					},
				},
				default: '480x852',
			},
			{
				displayName: 'Resolution',
				name: 'squareSize',
				type: 'options',
				description: 'Width and height of the output video in pixels',
				options: [
					{
						name: '768x768',
						value: '768x768',
					},
					{
						name: '512x512',
						value: '512x512',
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
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				description: 'Random seed for generation. Use -1 for a random seed.',
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
					maxValue: 240,
					numberPrecision: 0,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['replace'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const videoBinaryProperty = this.getNodeParameter('videoBinaryProperty', i) as string;
	const refImageBinaryProperty = this.getNodeParameter('refImageBinaryProperty', i) as string;
	const prompt = this.getNodeParameter('prompt', i) as string;
	const ratio = this.getNodeParameter('ratio', i) as
		| 'original'
		| 'square'
		| 'landscape'
		| 'portrait';
	const options = this.getNodeParameter('options', i);

	// Hardcoded model - only one available for video-replace
	const model = 'Wan2_2_Animate_14B_INT8';

	// Seed
	let seed = options.seed as number | undefined;
	if (seed == null || seed === -1) {
		seed = Math.floor(Math.random() * 4_294_967_296);
	}

	// Resolution
	let width: number | null = null;
	let height: number | null = null;

	if (ratio !== 'original') {
		const size = (options.squareSize ?? options.landscapeSize ?? options.portraitSize) as
			| string
			| undefined;

		if (size == null) {
			switch (ratio) {
				case 'landscape':
					width = 852;
					height = 480;
					break;
				case 'portrait':
					width = 480;
					height = 852;
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
	}

	// Wait Timeout
	const waitTimeout = (options.waitTimeout as number | undefined) ?? 120;
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	// Put execution to wait FIRST - this registers the waiting webhook
	await this.putExecutionToWait(waitTill);

	// Construct the webhook URL for deAPI to call back
	const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;
	const webhookUrl = `${resumeUrl}/webhook`;

	// Get video binary data
	const {
		fileContent: videoContent,
		contentType: videoContentType,
		filename: videoFilename,
	} = await getBinaryDataFile(this, i, videoBinaryProperty);

	// Get reference image binary data
	const {
		fileContent: refImageContent,
		contentType: refImageContentType,
		filename: refImageFilename,
	} = await getBinaryDataFile(this, i, refImageBinaryProperty);

	const request: VideoReplaceRequest = {
		video: {
			filename: videoFilename || 'video',
			contentType: videoContentType,
			content: videoContent,
		},
		ref_image: {
			filename: refImageFilename || 'ref_image',
			contentType: refImageContentType,
			content: refImageContent,
		},
		model,
		prompt: prompt || null,
		width,
		height,
		steps: 4,
		seed,
		webhook_url: webhookUrl,
	};

	const boundary = `----n8nFormBoundary${Date.now()}`;
	const body = generateFormdataBody(boundary, request);

	await apiRequest.call(this, 'POST', '/videos/replace', {
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
