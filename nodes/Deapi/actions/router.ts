import {
  IExecuteFunctions,
  INodeExecutionData,
  NodeOperationError
} from 'n8n-workflow';

import type { DeApiType } from './node.type';
import * as image from './image';
import * as prompt from './prompt';

export async function router(this: IExecuteFunctions) {
  const returnData: INodeExecutionData[] = [];

  const items = this.getInputData();
  const resource = this.getNodeParameter('resource', 0);
  const operation = this.getNodeParameter('operation', 0);

  const deApiTypeData = {
    resource,
    operation,
  } as DeApiType;

  let execute;
  switch (deApiTypeData.resource) {
    case 'image':
      execute = image[deApiTypeData.operation].execute;
      break;
    case 'prompt':
      execute = prompt[deApiTypeData.operation].execute;
      break;
    default:
      throw new NodeOperationError(
        this.getNode(),
        `The operation "${operation}" is not supported!`
      );
  }

  for (let i = 0; i < items.length; i++) {
    try {
      const responseData = await execute.call(this, i);
      returnData.push(...responseData);
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
        continue;
      } else {
        // Adding `itemIndex` allows other workflows to handle this error
        if (error.context) {
          error.context.itemIndex = i;
          throw error;
        }

        throw new NodeOperationError(this.getNode(), error, {
          itemIndex: i,
          description: error.description,
        });
      }
    }
  }

  return [returnData];
}