import type { INodeProperties } from 'n8n-workflow';

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
        name: 'Flux.1 schnell',
        value: 'Flux1schnell'
      },
    ],
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
        name: 'size',
        type: 'options',
        description: 'Height and width of the generated image in pixels',
        options: [
          {
            name: '256x256',
            value: '256x256',
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
          },
        },
        default: '768x768',
      },
      {
        displayName: 'Steps',
        name: 'steps',
        type: 'number',
        description: 'Number of inference steps',
        typeOptions: {
          maxValue: 50,
          minValue: 1,
          numberPrecision: 0,
        },
        default: 8,
      },
      {
        displayName: 'Seed',
        name: 'seed',
        type: 'number',
        description: 'Random seed for generation. By default seed is random',
        typeOptions: {
          maxValue: 10000,
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