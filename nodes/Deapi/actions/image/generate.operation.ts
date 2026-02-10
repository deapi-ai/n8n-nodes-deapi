import type {
  INodeProperties,
  IExecuteFunctions,
  INodeExecutionData,
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import type {
  TextToImageRequest,
} from '../../helpers/interfaces';
import { apiRequest } from '../../transport';

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
    displayName: 'Model',
    name: 'model',
    type: 'options',
    description: 'The model to use for image generation',
    default: 'Flux_2_Klein_4B_BF16',
    required: true,
    options: [
      {
        name: 'Z-Image-Turbo INT8',
        value: 'ZImageTurbo_INT8'
      },
      {
        name: 'Flux.1 Schnell',
        value: 'Flux1schnell'
      },
      {
        name: 'FLUX.2 Klein 4B BF16',
        value: 'Flux_2_Klein_4B_BF16'
      },
    ],
  },
  {
    displayName: 'Ratio',
    name: 'ratio',
    type: 'options',
    description: 'Aspect ratio of the generated image',
    required: true,
    options: [
      {
        name: 'Square',
        value: 'square',
      },
      {
        name: 'Landscape',
        value: 'landscape',
      },
      {
        name: 'Portrait',
        value: 'portrait',
      },
    ],
    default: 'square',
    noDataExpression: true,
  },
  {
    displayName: 'Options',
    name: 'options',
    placeholder: 'Add Option',
    type: 'collection',
    default: {},
    options: [
      {
        displayName: 'Negative Prompt',
        name: 'negativePrompt',
        type: 'string',
        placeholder: 'e.g. blur, darkness, noise',
        description: 'Elements to avoid in the generated image',
        default: '',
        typeOptions: {
          rows: 1,
        },
        displayOptions: {
          show: {
            '/model': ['Flux1schnell', 'ZImageTurbo_INT8'],
          },
        },
      },
      {
        displayName: 'Resolution',
        name: 'Flux1SquareSize',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '1024x1024',
            value: '1024x1024',
          },
          {
            name: '2048x2048',
            value: '2048x2048',
          },
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
        ],
        displayOptions: {
          show: {
            '/model': ['Flux1schnell'],
            '/ratio': ['square'],
          },
        },
        default: '768x768',
      },
      {
        displayName: 'Resolution',
        name: 'Flux2SquareSize',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '1024x1024',
            value: '1024x1024',
          },
          {
            name: '1536x1536',
            value: '1536x1536',
          },
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
        ],
        displayOptions: {
          show: {
            '/model': ['Flux_2_Klein_4B_BF16'],
            '/ratio': ['square'],
          },
        },
        default: '1024x1024',
      },
      {
        displayName: 'Resolution',
        name: 'ZImageSquareSize',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '1024x1024',
            value: '1024x1024',
          },
          {
            name: '2048x2048',
            value: '2048x2048',
          },
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
        ],
        displayOptions: {
          show: {
            '/model': ['ZImageTurbo_INT8'],
            '/ratio': ['square'],
          },
        },
        default: '768x768',
      },
      {
        displayName: 'Resolution',
        name: 'ZImageLandscapeSize',
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
            '/ratio': ['landscape'],
          },
        },
        default: '2048x1152',
      },
      {
        displayName: 'Resolution',
        name: 'Flux1LandscapeSize',
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
            '/ratio': ['landscape'],
          },
        },
        default: '1280x720',
      },
      {
        displayName: 'Resolution',
        name: 'Flux2LandscapeSize',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '1280x720',
            value: '1280x720',
          },
          {
            name: '1536x864',
            value: '1536x864',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['Flux_2_Klein_4B_BF16'],
            '/ratio': ['landscape'],
          },
        },
        default: '1280x720',
      },
      {
        displayName: 'Resolution',
        name: 'Flux1PortraitSize',
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
            '/ratio': ['portrait'],
          },
        },
        default: '720x1280',
      },
      {
        displayName: 'Resolution',
        name: 'Flux2PortraitSize',
        type: 'options',
        description: 'Width and height of the generated image in pixels',
        options: [
          {
            name: '768x960',
            value: '768x960',
          },
          {
            name: '1216x1520',
            value: '1216x1520',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['Flux_2_Klein_4B_BF16'],
            '/ratio': ['portrait'],
          },
        },
        default: '1216x1520',
      },
      {
        displayName: 'Resolution',
        name: 'ZImagePortraitSize',
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
            '/ratio': ['portrait'],
          },
        },
        default: '1152x2048',
      },
      {
        displayName: 'Seed',
        name: 'seed',
        type: 'number',
        description: 'Random seed for generation. By default seed is random.',
        typeOptions: {
          // Max 32-bit unsigned number
          maxValue: 4_294_967_295,
          minValue: -1,
          numberPrecision: 0,
        },
        default: -1,
      },
      {
        displayName: 'Steps',
        name: 'Flux1Steps',
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
        displayName: 'Steps',
        name: 'ZImageSteps',
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
        displayName: 'Wait Timeout',
        name: 'waitTimeout',
        type: 'number',
        description: 'Maximum time to wait for completion in seconds',
        default: 60,
        typeOptions: {
          minValue: 30,
          maxValue: 240, // 4 minutes
          numberPrecision: 0,
        },
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

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  // Combine these types for switch statements, to conclude default values when options aren't provided.
  type Model = 'ZImageTurbo_INT8' | 'Flux1schnell' | 'Flux_2_Klein_4B_BF16';
  type Ratio = 'square' | 'landscape' | 'portrait';

  const prompt = this.getNodeParameter('prompt', i) as string;
  const model = this.getNodeParameter('model', i) as Model;
  const ratio = this.getNodeParameter('ratio', i) as Ratio;
  const options = this.getNodeParameter('options', i);

  // Negative Prompt
  const negativePrompt = options.negativePrompt as (string | undefined);

  const size = (
    options.Flux2SquareSize ??
    options.Flux2LandscapeSize ??
    options.Flux2PortraitSize ??
    options.ZImageSquareSize ??
    options.ZImageLandscapeSize ??
    options.ZImagePortraitSize ??
    options.Flux1SquareSize ??
    options.Flux1LandscapeSize ??
    options.Flux1PortraitSize
  ) as string;

  // Width and height
  let width: number, height: number;
  if (size == null) {
    switch (`${model}-${ratio}`) {
      case 'ZImageTurbo_INT8-square':
      case 'Flux1schnell-square':
        width = 768;
        height = 768;
        break;
      case 'Flux_2_Klein_4B_BF16-square':
        width = 1024;
        height = 1024;
        break;
      case 'ZImageTurbo_INT8-landscape':
        width = 2048;
        height = 1152;
        break;
      case 'Flux1schnell-landscape':
      case 'Flux_2_Klein_4B_BF16-landscape':
        width = 1280;
        height = 720;
        break;
      case 'ZImageTurbo_INT8-portrait':
        width = 1152;
        height = 2048;
        break;
      case 'Flux_2_Klein_4B_BF16-portrait':
        width = 1216;
        height = 1520;
        break;
      case 'Flux1schnell-portrait':
      default:
        width = 720;
        height = 1280;
        break;
    }
  } else {
    [width, height] = size.split('x').map(Number);
  }

  // Steps
  let steps = (
    options.ZImageSteps ??
    options.Flux1Steps
  ) as (number | undefined);
  if (steps == null) {
    switch (model) {
      case 'ZImageTurbo_INT8':
        steps = 8;
        break;
      case 'Flux1schnell':
      case 'Flux_2_Klein_4B_BF16':
        steps = 4;
        break;
    }
  }

  // Seed
  let seed = options.seed as (number | undefined);
  if (seed == null || seed === -1) {
    seed = Math.floor(Math.random() * 4_294_967_296);
  }

  // Get wait timeout configuration (in seconds)
  const waitTimeout = options.waitTimeout as (number | undefined) ?? 60;

  // Calculate wait time (convert seconds to milliseconds)
  const waitTill = new Date(Date.now() + waitTimeout * 1000);

  // Put execution to wait FIRST - this registers the waiting webhook
  await this.putExecutionToWait(waitTill);

  // NOW get the webhook resume URL (after the webhook is registered)
  const webhookUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;

  // Build the request body with webhook URL
  const body: TextToImageRequest = {
    prompt: prompt,
    negative_prompt: negativePrompt,
    model: model,
    width: width,
    height: height,
    steps: steps,
    seed: seed,
    webhook_url: webhookUrl,
  };

  // Submit the request to deAPI
  await apiRequest.call(this, 'POST', '/txt2img', { body });

  // Return the current input data
  // When the webhook is called, the webhook() method will provide the actual output
  return this.getInputData();
}