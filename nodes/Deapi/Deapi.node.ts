import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import * as image from './actions/image';
import { router } from './actions/router';

export class Deapi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'deAPI',
		name: 'deapi',
		icon: 'file:deapi.svg',
		group: ['transform'],
		version: 1,
    subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Interact with deAPI models',
		defaults: {
			name: 'deAPI',
		},
    usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
    // TODO: codex field
    credentials: [
      {
        name: 'deApi',
        required: true,
      },
    ],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
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
          }
        ],
        default: 'image',
      },
      ...image.description,
		],
	};

  async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
