import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	updateDisplayOptions,
} from 'n8n-workflow';

import type { TextToVideoRequest, ImageToVideoRequest } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';

const properties: INodeProperties[] = [
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		required: true,
		description: 'Generate video from text prompt only or from image(s)',
		options: [
			{
				name: 'Text Prompt',
				value: 'text',
				description: 'Generate a video from a text description only',
			},
			{
				name: 'Image(s)',
				value: 'image',
				description: 'Generate a video using first frame image (and optionally last frame)',
			},
		],
		default: 'text',
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		placeholder: 'e.g. A beautiful sunset over mountains',
		description: 'A text description of the desired video',
		default: '',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: 'Binary Field Name For The First Frame',
		name: 'firstFrame',
		type: 'string',
		default: 'data',
		required: true,
		placeholder: 'e.g. data',
		description: 'The name of the binary field containing the first frame',
		displayOptions: {
			show: {
				source: ['image'],
			},
		},
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		description: 'The model to use for video generation',
		default: 'Ltx2_19B_Dist_FP8',
		required: true,
		options: [
			{
				name: 'LTX-Video-0.9.8 13B',
				value: 'Ltxv_13B_0_9_8_Distilled_FP8',
			},
			{
				name: 'LTX-2 19B Distilled FP8',
				value: 'Ltx2_19B_Dist_FP8',
			},
		],
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
				displayName: 'Binary Field Name For The Last Frame',
				name: 'lastFrame',
				type: 'string',
				default: 'data1',
				placeholder: 'e.g. data',
				description: 'The name of the binary field containing the last frame',
				displayOptions: {
					show: {
						'/source': ['image'],
					},
				},
			},
			{
				displayName: 'Frames',
				name: 'Ltx1Frames',
				type: 'number',
				description: 'Number of video frames to generate',
				typeOptions: {
					maxValue: 120,
					minValue: 30,
					numberPrecision: 0,
				},
				displayOptions: {
					show: {
						'/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
					},
				},
				default: 120,
			},
			{
				displayName: 'Frames',
				name: 'Ltx2Frames',
				type: 'number',
				description: 'Number of video frames to generate',
				typeOptions: {
					maxValue: 241,
					minValue: 49,
					numberPrecision: 0,
				},
				displayOptions: {
					show: {
						'/model': ['Ltx2_19B_Dist_FP8'],
					},
				},
				default: 120,
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				placeholder: 'e.g. blur, darkness, noise',
				description: 'Elements to avoid in the generated video',
				default: '',
				typeOptions: {
					rows: 1,
				},
				displayOptions: {
					show: {
						'/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
					},
				},
			},
			{
				displayName: 'Resolution',
				name: 'Ltx1LandscapeSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '768x432',
						value: '768x432',
					},
					{
						name: '640x360',
						value: '640x360',
					},
					{
						name: '512x288',
						value: '512x288',
					},
				],
				displayOptions: {
					show: {
						'/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
						'/ratio': ['landscape'],
					},
				},
				default: '512x288',
			},
			{
				displayName: 'Resolution',
				name: 'Ltx1PortraitSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '614x768',
						value: '614x768',
					},
					{
						name: '512x640',
						value: '512x640',
					},
					{
						name: '410x512',
						value: '410x512',
					},
				],
				displayOptions: {
					show: {
						'/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
						'/ratio': ['portrait'],
					},
				},
				default: '410x512',
			},
			{
				displayName: 'Resolution',
				name: 'Ltx1SquareSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '768x768',
						value: '768x768',
					},
					{
						name: '512x512',
						value: '512x512',
					},
					{
						name: '256x256',
						value: '256x256',
					},
				],
				displayOptions: {
					show: {
						'/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
						'/ratio': ['square'],
					},
				},
				default: '512x512',
			},
			{
				displayName: 'Resolution',
				name: 'Ltx2LandscapeSize',
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
						'/model': ['Ltx2_19B_Dist_FP8'],
						'/ratio': ['landscape'],
					},
				},
				default: '1024x576',
			},
			{
				displayName: 'Resolution',
				name: 'Ltx2PortraitSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '720x900',
						value: '720x900',
					},
					{
						name: '819x1024',
						value: '819x1024',
					},
				],
				displayOptions: {
					show: {
						'/model': ['Ltx2_19B_Dist_FP8'],
						'/ratio': ['portrait'],
					},
				},
				default: '720x900',
			},
			{
				displayName: 'Resolution',
				name: 'Ltx2SquareSize',
				type: 'options',
				description: 'Width and height of the generated video in pixels',
				options: [
					{
						name: '768x768',
						value: '768x768',
					},
					{
						name: '512x512',
						value: '512x512',
					},
					{
						name: '1024x1024',
						value: '1024x1024',
					},
				],
				displayOptions: {
					show: {
						'/model': ['Ltx2_19B_Dist_FP8'],
						'/ratio': ['square'],
					},
				},
				default: '768x768',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				description: 'Random seed for generation. By default seed is random.',
				typeOptions: {
					// Max 32-bit unsigned number
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
				default: 60,
				typeOptions: {
					minValue: 30,
					maxValue: 240, // 4 minutes
					numberPrecision: 0,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['generate'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	type Model = 'Ltxv_13B_0_9_8_Distilled_FP8' | 'Ltx2_19B_Dist_FP8';
	type Ratio = 'square' | 'landscape' | 'portrait';

	const source = this.getNodeParameter('source', i) as 'text' | 'image';
	const prompt = this.getNodeParameter('prompt', i) as string;
	const model = this.getNodeParameter('model', i) as Model;
	const ratio = this.getNodeParameter('ratio', i) as Ratio;
	const options = this.getNodeParameter('options', i);

	// Frames
	const frames = (options.Ltx1Frames ?? options.Ltx2Frames) as number | undefined;

	// FPS, steps, guidance
	let fps, steps, guidance;
	if (model === 'Ltx2_19B_Dist_FP8') {
		fps = 24;
		steps = 8;
		guidance = 1.0;
	} else {
		fps = 30;
		steps = 1;
		guidance = 0.0;
	}

	const size = (options.Ltx2SquareSize ??
		options.Ltx2LandscapeSize ??
		options.Ltx2PortraitSize ??
		options.Ltx1SquareSize ??
		options.Ltx1LandscapeSize ??
		options.Ltx1PortraitSize) as string | undefined;

	// Width and height
	let width: number, height: number;
	if (size == null) {
		switch (`${model}-${ratio}`) {
			case 'Ltx2_19B_Dist_FP8-square':
				width = 768;
				height = 768;
				break;
			case 'Ltx2_19B_Dist_FP8-landscape':
				width = 1024;
				height = 576;
				break;
			case 'Ltx2_19B_Dist_FP8-portrait':
				width = 720;
				height = 900;
				break;
			case 'Ltxv_13B_0_9_8_Distilled_FP8-square':
				width = 512;
				height = 512;
				break;
			case 'Ltxv_13B_0_9_8_Distilled_FP8-landscape':
				width = 512;
				height = 288;
				break;
			case 'Ltxv_13B_0_9_8_Distilled_FP8-portrait':
			default:
				width = 288;
				height = 512;
				break;
		}
	} else {
		const parts = size.split('x').map(Number);
		width = parts[0];
		height = parts[1];
		if (!Number.isFinite(width) || !Number.isFinite(height)) {
			throw new Error(`Invalid resolution format: "${size}". Expected "WIDTHxHEIGHT".`);
		}
	}

	// Negative Prompt
	const negativePrompt = options.negativePrompt as string | undefined;

	// Seed
	let seed = options.seed as number | undefined;
	if (seed == null || seed === -1) {
		seed = Math.floor(Math.random() * 4_294_967_296);
	}

	// Wait Timeout
	const waitTimeout = (options.waitTimeout as number | undefined) ?? 60;

	// Calculate wait time (convert seconds to milliseconds)
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	// Put execution to wait FIRST - this registers the waiting webhook
	await this.putExecutionToWait(waitTill);

	// NOW get the webhook resume URL (after the webhook is registered)
	const webhookUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;

	if (source === 'text') {
		// Text-to-video: use JSON body
		const body: TextToVideoRequest = {
			prompt: prompt,
			model: model,
			frames: frames ?? 120,
			width: width,
			height: height,
			negative_prompt: negativePrompt,
			seed: seed,
			steps: steps,
			guidance: guidance,
			fps: fps,
			webhook_url: webhookUrl,
		};

		await apiRequest.call(this, 'POST', '/txt2video', { body });
	} else {
		// Image-to-video: use multipart form-data
		const firstFrame = this.getNodeParameter('firstFrame', i) as string;

		const { fileContent, contentType, filename } = await getBinaryDataFile(this, i, firstFrame);
		const ff: ImageToVideoRequest['first_frame_image'] = {
			filename: filename || 'file',
			contentType,
			content: fileContent,
		};

		// Last frame (optional)
		const lastFrame = options.lastFrame as string | undefined;
		let lf: ImageToVideoRequest['last_frame_image'] = null;
		if (lastFrame) {
			const { fileContent, contentType, filename } = await getBinaryDataFile(this, i, lastFrame);
			lf = { filename: filename || 'file', contentType, content: fileContent };
		}

		const request: ImageToVideoRequest = {
			prompt: prompt,
			model: model,
			first_frame_image: ff,
			frames: frames ?? 120,
			width: width,
			height: height,
			last_frame_image: lf,
			negative_prompt: negativePrompt ?? null,
			seed: seed,
			steps: steps,
			guidance: guidance,
			fps: fps,
			webhook_url: webhookUrl,
		};

		const boundary = `----n8nFormBoundary${Date.now()}`;
		const body = generateFormdataBody(boundary, request);

		await apiRequest.call(this, 'POST', '/img2video', {
			headers: {
				'Content-Type': `multipart/form-data; boundary=${boundary}`,
			},
			option: {
				body,
				json: false,
			},
		});
	}

	// Return the current input data
	// When the webhook is called, the webhook() method will provide the actual output
	return [this.getInputData()[i]];
}
