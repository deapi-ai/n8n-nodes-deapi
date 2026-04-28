import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	updateDisplayOptions,
} from 'n8n-workflow';

import type { VideoUpscaleRequest } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';

const properties: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		required: true,
		options: [
			{
				name: 'RealESRGAN Video',
				value: 'RealESRGAN_Video',
			},
			{
				name: 'FlashVSR Tiny',
				value: 'FlashVSR_Tiny',
			},
		],
		default: 'RealESRGAN_Video',
	},
	{
		displayName: 'Scale',
		name: 'scaleRealESRGAN',
		type: 'options',
		required: true,
		description: 'Upscale factor for the video',
		options: [
			{
				name: '2x',
				value: 'RealESRGAN_Vid_x2',
			},
			{
				name: '4x',
				value: 'RealESRGAN_Vid_x4',
			},
		],
		default: 'RealESRGAN_Vid_x4',

		displayOptions: {
			show: {
				model: ['RealESRGAN_Video'],
			},
		},
	},
	{
		displayName: 'Scale',
		name: 'scaleFlashVSR',
		type: 'options',
		required: true,
		description: 'Upscale factor for the video',
		options: [
			{
				name: '2x',
				value: 2,
			},
			{
				name: '3x',
				value: 3,
			},
			{
				name: '4x',
				value: 4,
			},
		],
		default: 2,

		displayOptions: {
			show: {
				model: ['FlashVSR_Tiny'],
			},
		},
	},
	{
		displayName: 'Binary Field Name for Video',
		name: 'videoBinaryProperty',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		description:
			'The name of the binary field containing the video file. Supported formats: MP4, MPEG, QuickTime, AVI, WMV, OGG. Max 10 MB. Max duration: 10 seconds. Min/max resolution: 128x128 to 1024x1024 pixels.',
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
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
		operation: ['upscale'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', i) as string;
	const videoBinaryProperty = this.getNodeParameter('videoBinaryProperty', i) as string;
	const options = this.getNodeParameter('options', i);

	// Determine actual model slug and scale based on selected model
	let actualModel: string;
	let scale: number | null = null;

	if (model === 'RealESRGAN_Video') {
		// Scale dropdown value IS the model slug (e.g. RealESRGAN_Vid_x2, RealESRGAN_Vid_x4)
		actualModel = this.getNodeParameter('scaleRealESRGAN', i) as string;
	} else {
		// FlashVSR_Tiny: model stays FlashVSR_Tiny, scale is a separate integer
		actualModel = 'FlashVSR_Tiny';
		scale = this.getNodeParameter('scaleFlashVSR', i) as number;
	}

	// Wait Timeout
	const waitTimeout = (options.waitTimeout as number | undefined) ?? 120;
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	await this.putExecutionToWait(waitTill);

	const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;
	const webhookUrl = `${resumeUrl}/webhook`;

	// Get video binary data
	const {
		fileContent: videoContent,
		contentType: videoContentType,
		filename: videoFilename,
	} = await getBinaryDataFile(this, i, videoBinaryProperty);

	const request: VideoUpscaleRequest = {
		video: {
			filename: videoFilename || 'video',
			contentType: videoContentType,
			content: videoContent,
		},
		model: actualModel,
		scale,
		webhook_url: webhookUrl,
	};

	const boundary = `----n8nFormBoundary${Date.now()}`;
	const body = generateFormdataBody(boundary, request);

	await apiRequest.call(this, 'POST', '/vid-upscale', {
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
