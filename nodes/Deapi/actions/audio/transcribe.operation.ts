import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	updateDisplayOptions,
} from 'n8n-workflow';

import type { AudioFileToTextRequest } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';

const properties: INodeProperties[] = [
	{
		displayName: 'Binary Field Name',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		description:
			'The name of the binary field containing the audio file. Supported formats: AAC, MP3, OGG, WAV, WebM, FLAC. Max 10 MB.',
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
		resource: ['audio'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
	const includeTimestamps = this.getNodeParameter('includeTimestamps', i) as boolean;
	const options = this.getNodeParameter('options', i);

	const waitTimeout = (options.waitTimeout as number | undefined) ?? 120;

	// Calculate wait time (convert seconds to milliseconds)
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	// Put execution to wait FIRST - this registers the waiting webhook
	await this.putExecutionToWait(waitTill);

	// NOW get the webhook resume URL (after the webhook is registered)
	const webhookUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;

	const { fileContent, contentType, filename } = await getBinaryDataFile(
		this,
		i,
		binaryPropertyName,
	);

	const request: AudioFileToTextRequest = {
		audio: {
			filename: filename || 'audio',
			contentType,
			content: fileContent,
		},
		include_ts: includeTimestamps,
		model: 'WhisperLargeV3',
		webhook_url: webhookUrl,
	};

	const boundary = `----n8nFormBoundary${Date.now()}`;
	const body = generateFormdataBody(boundary, request);

	await apiRequest.call(this, 'POST', '/audiofile2txt', {
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
	return [this.getInputData()[i]];
}
