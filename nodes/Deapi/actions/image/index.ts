import type { INodeProperties } from 'n8n-workflow';

import * as generate from './generate.operation';
import * as removeBackground from './removeBackground.operation';

export { generate, removeBackground };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Generate an Image',
        value: 'generate',
        action: 'Generate an image',
        description: 'Generates an image from a text prompt'
      },
      {
        name: 'Edit Image',
        value: 'edit',
        action: 'Edit image',
        description: 'Generates a new image from an image'
      },
      {
        name: 'Remove Background',
        value: 'removeBackground',
        action: 'Remove background',
        description: 'Remove the background from an image'
      }
    ],
    default: 'generate',
    displayOptions: {
      show: {
        resource: ['image'],
      },
    },
  },
  ...generate.description,
  ...removeBackground.description,
];