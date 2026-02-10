import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  updateDisplayOptions,
} from "n8n-workflow";

import { apiRequest } from "../../transport";
import { getBinaryDataFile } from '../../helpers/binary-data';
import { generateFormdataBody } from '../../helpers/formdata';
import type { VideoPromptBoosterRequest, BoosterResponse } from "../../helpers/interfaces";

const properties: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    required: true,
    placeholder: 'e.g. A cinematic video sequence',
    description: 'A prompt to boost for video generation',
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
        name: 'negative_prompt',
        type: 'string',
        placeholder: 'e.g. blur, darkness, noise',
        description: 'A negative prompt to boost',
        default: '',
        typeOptions: {
          rows: 1,
        },
      },
      {
        displayName: 'Binary Field Name',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        placeholder: 'e.g. data',
        description: 'The name of the binary field containing the image data',
      },
    ],
  },
];

const displayOptions = {
	show: {
		operation: ['boostVideo'],
		resource: ['prompt'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {

  const prompt = this.getNodeParameter('prompt', i) as string;
  const options = this.getNodeParameter('options', i);
  const negativePrompt = options.negative_prompt as (string | undefined);
  const refImage = options.binaryPropertyName as (string | undefined);

  let image: VideoPromptBoosterRequest['image'] = null;
  if (refImage) {
    const { fileContent, contentType, filename } = await getBinaryDataFile(this, i, refImage);
    image = { filename: filename || 'file', contentType, content: fileContent };
  }

  const request: VideoPromptBoosterRequest = {
    prompt,
    negative_prompt: negativePrompt ?? null,
    image,
  };

  const boundary = `----n8nFormBoundary${Date.now()}`;
  const body = generateFormdataBody(boundary, request);

  // Send request with streamed multipart body using apiRequest
  const response = await apiRequest.call(this, 'POST', '/prompt/video', {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    option: {
      body,  // Pass body through option to support Readable type
      json: false,  // Disable JSON mode for multipart/form-data
    },
  }) as BoosterResponse;

  return [{
    json: response,
    pairedItem: {
      item: i,
    }
  }];
}