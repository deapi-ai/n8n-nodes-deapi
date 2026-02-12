import { mockDeep } from 'jest-mock-extended';
import type { IExecuteFunctions } from 'n8n-workflow';

import * as image from './image';
import * as video from './video';
import * as prompt from './prompt';
import { router } from './router';

describe('Deapi router', () => {
	const mockExecuteFunctions = mockDeep<IExecuteFunctions>();
	const mockImageGenerate = jest.spyOn(image.generate, 'execute');
	const mockVideoGenerateFromText = jest.spyOn(video.generateFromText, 'execute');
	const mockVideoGenerateFromImage = jest.spyOn(video.generateFromImage, 'execute');
	const mockVideoTranscribe = jest.spyOn(video.transcribe, 'execute');
	const mockPromptBoostImage = jest.spyOn(prompt.boostImage, 'execute');
	const mockPromptBoostVideo = jest.spyOn(prompt.boostVideo, 'execute');

	const operationMocks = [
		[mockImageGenerate, 'image', 'generate'],
		[mockVideoGenerateFromText, 'video', 'generateFromText'],
		[mockVideoGenerateFromImage, 'video', 'generateFromImage'],
		[mockVideoTranscribe, 'video', 'transcribe'],
		[mockPromptBoostImage, 'prompt', 'boostImage'],
		[mockPromptBoostVideo, 'prompt', 'boostVideo'],
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it.each(operationMocks)('should call the correct method', async (mock, resource, operation) => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(parameter: string) => (parameter === 'resource' ? resource : operation),
		);
		mockExecuteFunctions.getInputData.mockReturnValue([
			{
				json: {},
			},
		]);
		(mock as jest.Mock).mockResolvedValue([
			{
				json: {
					foo: 'bar',
				},
			},
		]);

		const result = await router.call(mockExecuteFunctions);

		expect(mock).toHaveBeenCalledWith(0);
		expect(result).toEqual([[{ json: { foo: 'bar' } }]]);
	});

	it('should return an error if the operation is not supported', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(parameter: string) => (parameter === 'resource' ? 'foo' : 'bar'),
		);
		mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);

		await expect(router.call(mockExecuteFunctions)).rejects.toThrow(
			'The operation "bar" is not supported!',
		);
	});

	it('should loop over all items', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(parameter: string) => (parameter === 'resource' ? 'image' : 'generate'),
		);
		mockExecuteFunctions.getInputData.mockReturnValue([
			{
				json: {
					text: 'item 1',
				},
			},
			{
				json: {
					text: 'item 2',
				},
			},
			{
				json: {
					text: 'item 3',
				},
			},
		]);
		mockImageGenerate.mockResolvedValueOnce([{ json: { response: 'foo' } }]);
		mockImageGenerate.mockResolvedValueOnce([{ json: { response: 'bar' } }]);
		mockImageGenerate.mockResolvedValueOnce([{ json: { response: 'baz' } }]);

		const result = await router.call(mockExecuteFunctions);

		expect(result).toEqual([
			[{ json: { response: 'foo' } }, { json: { response: 'bar' } }, { json: { response: 'baz' } }],
		]);
	});

	it('should continue on fail', async () => {
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(parameter: string) => (parameter === 'resource' ? 'image' : 'generate'),
		);
		mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		mockImageGenerate.mockRejectedValue(new Error('Some error'));

		const result = await router.call(mockExecuteFunctions);

		expect(result).toEqual([
			[
				{ json: { error: 'Some error' }, pairedItem: { item: 0 } },
				{ json: { error: 'Some error' }, pairedItem: { item: 1 } },
			],
		]);
	});

	it('should throw an error if continueOnFail is false', async () => {
		mockExecuteFunctions.continueOnFail.mockReturnValue(false);
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(parameter: string) => (parameter === 'resource' ? 'image' : 'generate'),
		);
		mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
		mockImageGenerate.mockRejectedValue(new Error('Some error'));

		await expect(router.call(mockExecuteFunctions)).rejects.toThrow('Some error');
	});

	it('should preserve error context when throwing', async () => {
		mockExecuteFunctions.continueOnFail.mockReturnValue(false);
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(parameter: string) => (parameter === 'resource' ? 'image' : 'generate'),
		);
		mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
		const errorWithContext = new Error('Some error') as Error & { context: Record<string, unknown> };
		errorWithContext.context = { someKey: 'someValue' };
		mockImageGenerate.mockRejectedValue(errorWithContext);

		try {
			await router.call(mockExecuteFunctions);
			fail('Expected error to be thrown');
		} catch (error) {
			expect((error as Error & { context: Record<string, unknown> }).context).toEqual({
				someKey: 'someValue',
				itemIndex: 0,
			});
		}
	});
});
