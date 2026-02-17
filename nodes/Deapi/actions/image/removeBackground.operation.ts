import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	updateDisplayOptions,
} from 'n8n-workflow';

import type { RemoveBackgroundRequest } from '../../helpers/interfaces';
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
			'The name of the binary field containing the image file. Supported formats: JPG, JPEG, PNG, GIF, BMP, WebP. Max 10 MB.',
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
				default: 60,
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
		operation: ['removeBackground'],
		resource: ['image'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
	const options = this.getNodeParameter('options', i);

	const waitTimeout = (options.waitTimeout as number | undefined) ?? 60;

	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	await this.putExecutionToWait(waitTill);

	const webhookUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;

	const { fileContent, contentType, filename } = await getBinaryDataFile(
		this,
		i,
		binaryPropertyName,
	);

	const request: RemoveBackgroundRequest = {
		image: {
			filename: filename || 'image',
			contentType,
			content: fileContent,
		},
		model: 'Ben2',
		webhook_url: webhookUrl,
	};

	const boundary = `----n8nFormBoundary${Date.now()}`;
	const body = generateFormdataBody(boundary, request);

	await apiRequest.call(this, 'POST', '/img-rmbg', {
		headers: {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
		},
		option: {
			body,
			json: false,
		},
	});

	return [this.getInputData()[i]];
}
