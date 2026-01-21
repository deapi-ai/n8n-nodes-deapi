import type {
  INodeProperties,
  IExecuteFunctions,
  INodeExecutionData
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

const properties: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    required: true,
    placeholder: 'e.g. Red Bull F1 car from 2025',
    description: 'A text description of the desired image',
    default: '',
    typeOptions: {
      rows: 2,
    },
  },
  {
    displayName: 'Negative Prompt',
    name: 'negative_prompt',
    type: 'string',
    placeholder: 'e.g. blur, darkness, noise',
    description: 'Elements to avoid in the generated image',
    default: '',
    typeOptions: {
      rows: 1,
    },
  },
  {
    displayName: 'Model',
    name: 'model',
    type: 'options',
    description: 'The model to use for image generation',
    default: 'ZImageTurbo_INT8',
    options: [
      {
        name: 'Z-Image-Turbo INT8',
        value: 'ZImageTurbo_INT8'
      },
      {
        name: 'Flux.1 Schnell',
        value: 'Flux1schnell'
      },
    ],
  },
  {
    displayName: 'Ratio',
    name: 'ratio',
    type: 'options',
    description: 'Aspect ratio of the generated image',
    options: [
      {
        name: '1:1',
        value: '1:1',
      },
      {
        name: '16:9',
        value: '16:9',
      },
      {
        name: '9:16',
        value: '9:16',
      },
    ],
    default: '1:1',
  },
  {
    displayName: 'Options',
    name: 'options',
    placeholder: 'Add Option',
    type: 'collection',
    default: {},
    options: [
      // {
      //   displayName: 'Quality',
      //   name: 'quality',
      //   type: 'options',
      //   description: 'The quality of the image that will be generated',
      //   options: [
      //     {
      //       name: 'High',
      //       value: 'high'
      //     },
      //     {
      //       name: 'Medium',
      //       value: 'medium'
      //     },
      //     {
      //       name: 'Low',
      //       value: 'low'
      //     },
      //   ],
      //   displayOptions: {
      //     show: {
      //       '/model': ['ZImageTurbo_INT8', 'Flux1schnell']
      //     },
      //   },
      //   // TO DECIDE the default quality of generated image.
      //   default: 'medium',
      // },
      {
        displayName: 'Resolution',
        name: 'square_size',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '256x256',
            value: '256x256',
          },
          {
            name: '512x512',
            value: '512x512',
          },
          {
            name: '768x768',
            value: '768x768',
          },
          {
            name: '1024x1024',
            value: '1024x1024',
          },
          {
            name: '2048x2048',
            value: '2048x2048',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['ZImageTurbo_INT8', 'Flux1schnell'],
            '/ratio': ['1:1'],
          },
        },
        default: '768x768',
      },
      {
        displayName: 'Resolution',
        name: 'ZImageTurbo_INT8_landscape_size',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '2048x1152',
            value: '2048x1152',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['ZImageTurbo_INT8'],
            '/ratio': ['16:9'],
          },
        },
        default: '2048x1152',
      },
      {
        displayName: 'Resolution',
        name: 'Flux1schnell_landscape_size',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '1280x720',
            value: '1280x720',
          },
          {
            name: '2048x1152',
            value: '2048x1152',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['Flux1schnell'],
            '/ratio': ['16:9'],
          },
        },
        default: '1280x720',
      },
      {
        displayName: 'Resolution',
        name: 'ZImageTurbo_INT8_portrait_size',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '1152x2048',
            value: '1152x2048',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['ZImageTurbo_INT8'],
            '/ratio': ['9:16'],
          },
        },
        default: '1152x2048',
      },
      {
        displayName: 'Resolution',
        name: 'Flux1schnell_portrait_size',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '720x1280',
            value: '720x1280',
          },
          {
            name: '1152x2048',
            value: '1152x2048',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['Flux1schnell'],
            '/ratio': ['9:16'],
          },
        },
        default: '720x1280',
      },
      {
        displayName: 'Steps',
        name: 'ZImageTurbo_INT8_steps',
        type: 'number',
        description: 'Number of inference steps',
        typeOptions: {
          maxValue: 50,
          minValue: 1,
          numberPrecision: 0,
        },
        displayOptions: {
          show: {
            '/model': ['ZImageTurbo_INT8']
          },
        },
        default: 8,
      },
      {
        displayName: 'Steps',
        name: 'Flux1schnell_steps',
        type: 'number',
        description: 'Number of inference steps',
        typeOptions: {
          maxValue: 10,
          minValue: 1,
          numberPrecision: 0,
        },
        displayOptions: {
          show: {
            '/model': ['Flux1schnell']
          },
        },
        default: 4,
      },
      {
        displayName: 'Seed',
        name: 'seed',
        type: 'number',
        description: 'Random seed for generation. By default seed is random.',
        typeOptions: {
          maxValue: Number.MAX_SAFE_INTEGER,
          minValue: -1,
          numberPrecision: 0,
        },
        default: -1,
      },
      {
				displayName: 'Put Output in Field',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				hint: 'The name of the output field to put the binary file data in',
			},
    ]
  }
];

const displayOptions = {
	show: {
		operation: ['generate'],
		resource: ['image'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

// export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
//   const model = this.getNodeParameter('model', i) as string;
//   const prompt = this.getNodeParameter('prompt', i) as string;
//   const options = this.getNodeParameter('options', i, {});
//   const binaryPropertyOutput = this.getNodeParameter(
// 		'options.binaryPropertyOutput',
// 		i,
// 		'data',
// 	) as string;
// }