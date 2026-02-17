import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  updateDisplayOptions,
} from "n8n-workflow";

import type {
  ImagePromptBoosterRequest,
  BoosterResponse,
} from '../../helpers/interfaces';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    required: true,
    placeholder: 'e.g. Red Bull F1 car from 2025',
    description: 'A prompt to boost for image generation',
    default: '',
    typeOptions: {
      rows: 1,
    },
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
        description: 'A negative prompt to boost',
        default: '',
        typeOptions: {
          rows: 1,
        },
      },
    ],
  },
];

const displayOptions = {
	show: {
		operation: ['boostImage'],
		resource: ['prompt'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {

  const prompt = this.getNodeParameter('prompt', i) as string;
  const options = this.getNodeParameter('options', i);
  const negativePrompt = options.negativePrompt as (string | undefined);

  // It doesn't consider the case where `prompt` or `negativePrompt`
  // don't have at least 3 characters. In this case, error from api is received.

  const body: ImagePromptBoosterRequest = {
    prompt: prompt,
    negative_prompt: negativePrompt ?? null,
  };

  const response = await (apiRequest.call(this, 'POST', '/prompt/image', { body })) as BoosterResponse;

  return [{
    json: response,
    pairedItem: {
      item: i,
    }
  }];
}