import type { INodeProperties } from 'n8n-workflow';

import * as boostTextToImage from './boostTextToImage.operation';

export { boostTextToImage };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Boost a Prompt For Text-to-Image',
        value: 'boostTextToImage',
        action: 'Boost a Prompt For Text-to-Image',
        description: 'Optimizes a prompt for text-to-image generation'
      },
    ],
    default: 'boostTextToImage',
    displayOptions: {
      show: {
        resource: ['prompt'],
      },
    },
  },
  ...boostTextToImage.description,
];