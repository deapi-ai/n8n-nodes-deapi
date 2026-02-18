import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

import type { DeApiType } from './node.type';
import * as image from './image';
import * as video from './video';
import * as audio from './audio';
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
		case 'video':
			execute = video[deApiTypeData.operation].execute;
			break;
		case 'audio':
			execute = audio[deApiTypeData.operation].execute;
			break;
		case 'prompt':
			execute = prompt[deApiTypeData.operation].execute;
			break;
		default:
			throw new NodeOperationError(
				this.getNode(),
				`The operation "${operation}" is not supported!`,
			);
	}

	// Operations that use putExecutionToWait can only process one item per execution,
	// because each execution supports only a single webhook callback to resume.
	const waitingOperations = new Set([
		'image:generate',
		'image:removeBackground',
		'image:upscale',
		'video:generate',
		'video:transcribe',
		'audio:transcribe',
	]);
	const isWaiting = waitingOperations.has(`${resource}:${operation}`);
	const itemCount = isWaiting ? 1 : items.length;

	for (let i = 0; i < itemCount; i++) {
		try {
			const responseData = await execute.call(this, i);
			returnData.push(...responseData);
		} catch (error) {
			if (this.continueOnFail()) {
				const message = error instanceof Error ? error.message : String(error);
				returnData.push({ json: { error: message }, pairedItem: { item: i } });
				continue;
			} else {
				// Adding `itemIndex` allows other workflows to handle this error
				if (error instanceof Error && 'context' in error && error.context) {
					(error.context as Record<string, unknown>).itemIndex = i;
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
					description: error instanceof Error ? (error as Error & { description?: string }).description : undefined,
				});
			}
		}
	}

	return [returnData];
}
