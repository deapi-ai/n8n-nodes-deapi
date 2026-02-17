import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { verifyWebhookSignature } from './helpers/webhook-verification';
import { downloadAndPrepareBinaryData } from './helpers/binary-data';

export class DeapiTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'deAPI Trigger',
		name: 'deapiTrigger',
		icon: 'file:deapi.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers workflows based on the status of the generation job from deAPI.',
		subtitle: 'deAPI Trigger',
		defaults: {
			name: 'deAPI Trigger',
		},
		usableAsTool: true,
		credentials: [
			{
				name: 'deApi',
				required: true,
			},
		],
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'deapi',
			},
		],
		properties: [
			{
				displayName: 'Trigger On',
				name: 'events',
				type: 'multiOptions',
				description: 'Select the events to trigger the workflow',
				required: true,
				default: ['jobCompleted'],
				options: [
					{
						name: 'Job Processing',
						value: 'jobProcessing',
						description: 'A job starts processing',
					},
					{
						name: 'Job Completed',
						value: 'jobCompleted',
						description: 'A job completes successfully',
					},
					{
						name: 'Job Failed',
						value: 'jobFailed',
						description: 'A job fails',
					},
				],
			},
			{
				displayName: 'Download Binary Result',
				name: 'downloadBinary',
				type: 'boolean',
				default: true,
				description: 'Whether to download the binary file from result_url when job completes',
				displayOptions: {
					show: {
						events: ['jobCompleted'],
					},
				},
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// deAPI doesn't provide a webhook management API
				// Webhooks are configured globally in the dashboard
				// Always return false to trigger create()
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				// Get the webhook URL that n8n generates for this workflow
				const webhookUrl = this.getNodeWebhookUrl('default');

				// Store it in static data for reference
				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookUrl = webhookUrl;

				// Log instructions for the user
				this.logger.info(`[deAPI] Configure this webhook URL in your deAPI dashboard: ${webhookUrl}`);
				this.logger.info(`[deAPI] Visit: https://deapi.ai/settings/webhooks`);

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				// Nothing to unregister since webhooks are configured in the dashboard
				// User must manually remove the webhook URL if they want to stop receiving events
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		// Get response object for sending HTTP responses
		const res = this.getResponseObject();

		// Get credentials for signature verification
		const credentials = await this.getCredentials('deApi');
		const secret = credentials.webhookSecret as string;

		// Get headers, raw body, and parsed body
		const headers = this.getHeaderData();
		const signature = headers['x-deapi-signature'] as string;
		const timestamp = headers['x-deapi-timestamp'] as string;
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

		// Signature verified, get event data
		const event = body.event as string;

		// Map deAPI events to n8n trigger options
		const eventMap: { [key: string]: string } = {
			'job.processing': 'jobProcessing',
			'job.completed': 'jobCompleted',
			'job.failed': 'jobFailed',
		};

		// Get user's selected events filter
		const selectedEvents = this.getNodeParameter('events') as string[];

		// Filter based on user's selection
		const mappedEvent = eventMap[event];
		if (!mappedEvent || !selectedEvents.includes(mappedEvent)) {
			// Event doesn't match selected filters, acknowledge but don't trigger workflow
			res.status(200).send('OK');
			return {
				noWebhookResponse: true,
			};
		}

		// Event matches, trigger the workflow
		res.status(200).send('OK');

		// For completed jobs, check if we should download binary result
		if (event === 'job.completed') {
			const downloadBinary = this.getNodeParameter('downloadBinary') as boolean;

			if (downloadBinary) {
				const data = body.data as IDataObject;
				const resultUrl = data.result_url as string | undefined;

				if (resultUrl) {
					// Download and prepare binary data
					const binaryData = await downloadAndPrepareBinaryData(this, resultUrl);

					return {
						workflowData: [
							[
								{
									json: {},
									binary: {
										data: binaryData,
									},
								},
							],
						],
					};
				}
			}
		}

		// Return JSON data
		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
