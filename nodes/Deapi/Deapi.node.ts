import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import * as image from './actions/image';
import * as video from './actions/video';
import * as audio from './actions/audio';
import * as prompt from './actions/prompt';
import { router } from './actions/router';
import { verifyWebhookSignature } from './helpers/webhook-verification';
import { downloadAndPrepareBinaryData } from './helpers/binary-data';

export class Deapi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'deAPI',
		name: 'deapi',
		icon: 'file:deapi.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["resource"] + ": " + $parameter["operation"] }}',
		description:
			'Generate images, videos, transcribe audio and boost prompts using deAPI AI models',
		defaults: {
			name: 'deAPI',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Image', 'Video', 'Audio', 'Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.deapi.ai/',
					},
				],
			},
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'deApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
				restartWebhook: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Image',
						value: 'image',
					},
					{
						name: 'Video',
						value: 'video',
					},
					{
						name: 'Audio',
						value: 'audio',
					},
					{
						name: 'Prompt',
						value: 'prompt',
					},
				],
				default: 'image',
			},
			...image.description,
			...video.description,
			...audio.description,
			...prompt.description,
		],
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		// Get response object for sending HTTP responses
		const res = this.getResponseObject();

		// Get webhook credentials for signature verification
		const credentials = await this.getCredentials('deApi');
		const secret = credentials.webhookSecret as string;

		// Get headers for verification
		const headers = this.getHeaderData();
		const signature = headers['x-deapi-signature'] as string;
		const timestamp = headers['x-deapi-timestamp'] as string;

		// Get request object for raw body and parsed body
		const req = this.getRequestObject();
		const rawBody = req.rawBody;
		const body = req.body;

		// Verify webhook signature
		if (!verifyWebhookSignature(secret, signature, timestamp, rawBody)) {
			res.status(401).send('Invalid signature');
			return {
				noWebhookResponse: true,
			};
		}

		// Signature verified, proceed with webhook processing
		const event = body.event as string;

		// DeAPI sends three types of events:
		// - job.processing: Job started processing (ignore, keep waiting)
		// - job.completed: Job completed successfully (resume execution)
		// - job.failed: Job failed (resume with error data)

		// If this is just a processing notification, acknowledge but don't resume
		if (event === 'job.processing') {
			res.status(200).send('OK');
			return {
				noWebhookResponse: true, // Don't resume execution, keep waiting
			};
		}

		// For completed jobs, download the binary result
		if (event === 'job.completed') {
			const data = body.data as IDataObject;
			const resultUrl = data.result_url as string | undefined;

			if (resultUrl) {
				// Download and prepare binary data
				const binaryData = await downloadAndPrepareBinaryData(this, resultUrl);

				const response: INodeExecutionData = {
					json: data,
					binary: {
						data: binaryData,
					},
				};

				return {
					workflowData: [[response]],
				};
			}

			// No result_url (e.g. transcription results) - return JSON directly
			const response: INodeExecutionData = {
				json: body,
			};

			return {
				workflowData: [[response]],
			};
		}

		// For failed jobs, return error data as JSON
		const response: INodeExecutionData = {
			json: body,
		};

		// Resume execution with the webhook data (n8n sends 200 via responseMode: 'onReceived')
		return {
			workflowData: [[response]],
		};
	}
}
