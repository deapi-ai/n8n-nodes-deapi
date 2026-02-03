import type {
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

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
        name: 'deapiWebhook',
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
      }
    ],
		properties: [
      {
        displayName: 'Trigger On',
        name: 'event',
        type: 'options',
        description: 'Select the event to trigger the workflow',
        default: 'jobCompleted',
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
            description: 'A job failes'
          },
        ],
      },
		],
	};

  // webhookMethods = {
  //   // TO DO: `checkExists`

  // };
}
