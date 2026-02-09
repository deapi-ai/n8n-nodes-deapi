import type { INodeProperties } from 'n8n-workflow';

import * as generateFromText from './generate-from-text.operation';
import * as generateFromImage from './generate-from-image.operation';

export { generateFromText, generateFromImage };

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
      {
        name: 'Generate a Video From Image',
        value: 'generateFromImage',
        action: 'Generate a video from image',
        description: 'Generates a video from an image'
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
  ...generateFromImage.description,
];