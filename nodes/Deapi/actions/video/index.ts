import type { INodeProperties } from 'n8n-workflow';

import * as generate from './generate.operation';

export { generate };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Generate a Video',
        value: 'generate',
        action: 'Generate a video',
        description: 'Generates a video from a text prompt'
      },
    ],
    default: 'generate',
    displayOptions: {
      show: {
        resource: ['video'],
      },
    },
  },
  ...generate.description,
];