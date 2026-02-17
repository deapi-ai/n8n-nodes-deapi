import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	updateDisplayOptions,
} from 'n8n-workflow';

import type { VideoToTextRequest, VideoFileToTextRequest } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';

const properties: INodeProperties[] = [
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		required: true,
		description: 'Where to get the video from',
		options: [
			{
				name: 'Video URL',
				value: 'url',
				description: 'Transcribe a video from a URL (YouTube, Twitch, X, Kick supported)',
			},
			{
				name: 'Binary File',
				value: 'binary',
				description: 'Transcribe a video file from binary data',
			},
		],
		default: 'url',
	},
	{
		displayName: 'Video URL',
		name: 'videoUrl',
		type: 'string',
		required: true,
		placeholder: 'e.g. https://www.youtube.com/watch?v=jNQXAC9IVRw',
		description:
			'URL of the video to transcribe. YouTube, Twitch VODs, X, and Kick videos are supported.',
		default: '',
		displayOptions: {
			show: {
				source: ['url'],
			},
		},
	},
	{
		displayName: 'Binary Field Name',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		description:
			'The name of the binary field containing the video file. Supported formats: MP4, MPEG, MOV, AVI, WMV, OGG. Max 10 MB.',
		displayOptions: {
			show: {
				source: ['binary'],
			},
		},
	},
	{
		displayName: 'Include Timestamps',
		name: 'includeTimestamps',
		type: 'boolean',
		required: true,
		default: true,
		description: 'Whether to include timestamps in the transcription output',
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
					maxValue: 600, // 10 minutes
					numberPrecision: 0,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['transcribe'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const source = this.getNodeParameter('source', i) as 'url' | 'binary';
	const includeTimestamps = this.getNodeParameter('includeTimestamps', i) as boolean;
	const options = this.getNodeParameter('options', i);

	const waitTimeout = (options.waitTimeout as number | undefined) ?? 120;

	// Calculate wait time (convert seconds to milliseconds)
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	// Put execution to wait FIRST - this registers the waiting webhook
	await this.putExecutionToWait(waitTill);

	// NOW get the webhook resume URL (after the webhook is registered)
	const webhookUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;

	if (source === 'url') {
		// Video URL - use JSON endpoint
		const videoUrl = this.getNodeParameter('videoUrl', i) as string;

		const body: VideoToTextRequest = {
			video_url: videoUrl,
			include_ts: includeTimestamps,
			model: 'WhisperLargeV3',
			webhook_url: webhookUrl,
		};

		await apiRequest.call(this, 'POST', '/vid2txt', { body });
	} else {
		// Binary file - use multipart form-data endpoint
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

		const { fileContent, contentType, filename } = await getBinaryDataFile(
			this,
			i,
			binaryPropertyName,
		);

		const request: VideoFileToTextRequest = {
			video: {
				filename: filename || 'video',
				contentType,
				content: fileContent,
			},
			include_ts: includeTimestamps,
			model: 'WhisperLargeV3',
			webhook_url: webhookUrl,
		};

		const boundary = `----n8nFormBoundary${Date.now()}`;
		const body = generateFormdataBody(boundary, request);

		await apiRequest.call(this, 'POST', '/videofile2txt', {
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
	return this.getInputData();
}
