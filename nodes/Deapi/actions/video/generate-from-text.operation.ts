import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  updateDisplayOptions
} from "n8n-workflow";

import type {
  TextToVideoRequest,
} from '../../helpers/interfaces';
import { apiRequest } from "../../transport";

const properties: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    required: true,
    placeholder: 'e.g. A beautiful sunset over mountains',
    description: 'A text description of the desired video',
    default: '',
    typeOptions: {
      rows: 2,
    },
  },
  {
    displayName: 'Model',
    name: 'model',
    type: 'options',
    description: 'The model to use for video generation',
    default: 'Ltxv_13B_0_9_8_Distilled_FP8',
    required: true,
    options: [
      {
        name: 'LTX-Video-0.9.8 13B',
        value: 'Ltxv_13B_0_9_8_Distilled_FP8'
      },
    ],
  },
  {
    displayName: 'Ratio',
    name: 'ratio',
    type: 'options',
    description: 'Aspect ratio of the generated video',
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
        displayName: 'Frames',
        name: 'frames',
        type: 'number',
        description: 'Number of video frames to generate',
        typeOptions: {
          maxValue: 120,
          minValue: 30,
          numberPrecision: 0,
        },
        displayOptions: {
          show: {
            '/model': ['Ltxv_13B_0_9_8_Distilled_FP8']
          },
        },
        default: 120,
      },
      {
        displayName: 'Negative Prompt',
        name: 'negativePrompt',
        type: 'string',
        placeholder: 'e.g. blur, darkness, noise',
        description: 'Elements to avoid in the generated video',
        default: '',
        typeOptions: {
          rows: 1,
        },
      },
      {
        displayName: 'Resolution',
        name: 'LtxLandscapeSize',
        type: 'options',
        description: 'Width and height of the generated video in pixels',
        options: [
          {
            name: '768x432',
            value: '768x432',
          },
          {
            name: '640x360',
            value: '640x360',
          },
          {
            name: '512x288',
            value: '512x288',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
            '/ratio': ['landscape'],
          },
        },
        default: '512x288',
      },
      {
        displayName: 'Resolution',
        name: 'LtxPortraitSize',
        type: 'options',
        description: 'Width and height of the generated video in pixels',
        options: [
          {
            name: '432x768',
            value: '432x768',
          },
          {
            name: '360x640',
            value: '360x640',
          },
          {
            name: '288x512',
            value: '288x512',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
            '/ratio': ['portrait'],
          },
        },
        default: '288x512',
      },
      {
        displayName: 'Resolution',
        name: 'LtxSquareSize',
        type: 'options',
        description: 'Width and height of the generated video in pixels',
        options: [
          {
            name: '768x768',
            value: '768x768',
          },
          {
            name: '512x512',
            value: '512x512',
          },
          {
            name: '256x256',
            value: '256x256',
          },
        ],
        displayOptions: {
          show: {
            '/model': ['Ltxv_13B_0_9_8_Distilled_FP8'],
            '/ratio': ['square'],
          },
        },
        default: '512x512',
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
    ],
  },
];

const displayOptions = {
	show: {
		operation: ['generateFromText'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  // Combine these types for switch statements, to conclude default values when options aren't provided.
  type Model = 'Ltxv_13B_0_9_8_Distilled_FP8';
  type Ratio = 'square' | 'landscape' | 'portrait';

  const prompt = this.getNodeParameter('prompt', i) as string;
  const model = this.getNodeParameter('model', i) as Model;
  const ratio = this.getNodeParameter('ratio', i) as Ratio;
  const options = this.getNodeParameter('options', i);

  // Frames
  const frames = options.frames as (number | undefined);

  const size = (
    options.LtxSquareSize ??
    options.LtxLandscapeSize ??
    options.LtxPortraitSize
  ) as (string | undefined);

  // Width and height
  let width: number, height: number;
  if (size == null) {
    switch (`${model}-${ratio}`) {
      case 'Ltxv_13B_0_9_8_Distilled_FP8-square':
        width = 512;
        height = 512;
        break;
      case 'Ltxv_13B_0_9_8_Distilled_FP8-landscape':
        width = 512;
        height = 288;
        break;
      case 'Ltxv_13B_0_9_8_Distilled_FP8-portrait':
      default:
        width = 288;
        height = 512;
        break;
    }
  } else {
    [width, height] = size.split('x').map(Number);
  }

  // Negative Prompt
  const negativePrompt = options.negativePrompt as (string | undefined);

  // Seed
  let seed = options.seed as (number | undefined);
  if (seed == null || seed === -1) {
    seed = Math.floor(Math.random() * 4_294_967_296);
  }

  // Wait Timeout
  const waitTimeout = options.waitTimeout as (number | undefined) ?? 60;

  // Calculate wait time (convert seconds to milliseconds)
  const waitTill = new Date(Date.now() + waitTimeout * 1000);

  // Put execution to wait FIRST - this registers the waiting webhook
  await this.putExecutionToWait(waitTill);

  // NOW get the webhook resume URL (after the webhook is registered)
  const webhookUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;

  // Build the request body with webhook URL
  const body: TextToVideoRequest = {
    prompt: prompt,
    model: model,
    frames: frames ?? 120,
    width: width,
    height: height,
    negative_prompt: negativePrompt,
    seed: seed,
    steps: 1,
    guidance: 0.0,
    fps: 30,
    webhook_url: webhookUrl,
  };

  // Submit the request to deAPI
  await apiRequest.call(this, 'POST', '/txt2video', { body });

  // Return the current input data
  // When the webhook is called, the webhook() method will provide the actual output
  return this.getInputData();
}