import type { INodeProperties } from 'n8n-workflow';

import * as generateFromText from './generate-from-text.operation';

export { generateFromText };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Generate a Video From Text',
        value: 'generateFromText',
        action: 'Generate a video from text',
        description: 'Generates a video from a text prompt'
      },
    ],
    default: 'generateFromText',
    displayOptions: {
      show: {
        resource: ['video'],
      },
    },
  },
  ...generateFromText.description,
];