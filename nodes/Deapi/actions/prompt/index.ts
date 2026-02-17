import type { INodeProperties } from 'n8n-workflow';

import * as imagePromptBooster from './imagePromptBooster.operation';
import * as videoPromptBooster from './videoPromptBooster.operation';

export { imagePromptBooster as boostImage, videoPromptBooster as boostVideo };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Image Prompt Booster',
				value: 'boostImage',
				action: 'Image prompt booster',
				description: 'Optimizes a prompt for text-to-image generation',
			},
			{
				name: 'Video Prompt Booster',
				value: 'boostVideo',
				action: 'Video prompt booster',
				description: 'Optimizes a prompt for text-image-to-video generation',
			},
		],
		default: 'boostImage',
		displayOptions: {
			show: {
				resource: ['prompt'],
			},
		},
	},
	...imagePromptBooster.description,
	...videoPromptBooster.description,
];
