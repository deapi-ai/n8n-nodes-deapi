/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import type { IBinaryData, IExecuteFunctions, IWebhookFunctions } from 'n8n-workflow';
import type { Readable } from 'stream';
import { mockDeep } from 'jest-mock-extended';
import { getBinaryDataFile, downloadAndPrepareBinaryData } from './binary-data';

describe('getBinaryDataFile', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('In-memory binary data (no id)', () => {
		it('should retrieve binary data stored in memory', async () => {
			const fileBuffer = Buffer.from('test file content');
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'test.txt',
				mimeType: 'text/plain',
				id: undefined,
			} as IBinaryData);
			mockContext.helpers.getBinaryDataBuffer.mockResolvedValue(fileBuffer);

			const result = await getBinaryDataFile(mockContext, 0, 'data');

			expect(mockContext.helpers.assertBinaryData).toHaveBeenCalledWith(0, 'data');
			expect(mockContext.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(0, 'data');
			expect(result).toEqual({
				filename: 'test.txt',
				contentType: 'text/plain',
				fileContent: fileBuffer,
			});
		});

		it('should handle binary data with special characters in filename', async () => {
			const fileBuffer = Buffer.from('content');
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'my-file (1).jpg',
				mimeType: 'image/jpeg',
				id: undefined,
			} as IBinaryData);
			mockContext.helpers.getBinaryDataBuffer.mockResolvedValue(fileBuffer);

			const result = await getBinaryDataFile(mockContext, 0, 'image');

			expect(result.filename).toBe('my-file (1).jpg');
			expect(result.contentType).toBe('image/jpeg');
		});

		it('should handle empty buffer', async () => {
			const emptyBuffer = Buffer.from('');
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'empty.txt',
				mimeType: 'text/plain',
				id: undefined,
			} as IBinaryData);
			mockContext.helpers.getBinaryDataBuffer.mockResolvedValue(emptyBuffer);

			const result = await getBinaryDataFile(mockContext, 0, 'data');

			expect(result.fileContent).toEqual(emptyBuffer);
			expect(result.fileContent.length).toBe(0);
		});
	});

	describe('External storage (with id)', () => {
		it('should retrieve and concatenate binary data from stream', async () => {
			const chunk1 = Buffer.from('chunk1');
			const chunk2 = Buffer.from('chunk2');
			const chunk3 = Buffer.from('chunk3');

			async function* mockStream() {
				yield chunk1;
				yield chunk2;
				yield chunk3;
			}

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'large-file.bin',
				mimeType: 'application/octet-stream',
				id: 'external-file-id-123',
			} as IBinaryData);
			mockContext.helpers.getBinaryStream.mockResolvedValue(mockStream() as unknown as Readable);

			const result = await getBinaryDataFile(mockContext, 0, 'data');

			expect(mockContext.helpers.assertBinaryData).toHaveBeenCalledWith(0, 'data');
			expect(mockContext.helpers.getBinaryStream).toHaveBeenCalledWith(
				'external-file-id-123',
				256 * 1024,
			);
			expect(result).toEqual({
				filename: 'large-file.bin',
				contentType: 'application/octet-stream',
				fileContent: Buffer.concat([chunk1, chunk2, chunk3]),
			});
			expect(result.fileContent.toString()).toBe('chunk1chunk2chunk3');
		});

		it('should handle single chunk stream', async () => {
			const singleChunk = Buffer.from('single chunk data');

			async function* mockStream() {
				yield singleChunk;
			}

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'file.txt',
				mimeType: 'text/plain',
				id: 'file-id',
			} as IBinaryData);
			mockContext.helpers.getBinaryStream.mockResolvedValue(mockStream() as unknown as Readable);

			const result = await getBinaryDataFile(mockContext, 0, 'data');

			expect(result.fileContent).toEqual(singleChunk);
		});

		it('should handle stream with binary data', async () => {
			const binaryChunk = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header

			async function* mockStream() {
				yield binaryChunk;
			}

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'image.png',
				mimeType: 'image/png',
				id: 'file-id',
			} as IBinaryData);
			mockContext.helpers.getBinaryStream.mockResolvedValue(mockStream() as unknown as Readable);

			const result = await getBinaryDataFile(mockContext, 0, 'data');

			expect(result.fileContent).toEqual(binaryChunk);
			expect(result.fileContent[0]).toBe(0x89); // PNG signature
		});

		it('should convert non-Buffer chunks to Buffer', async () => {
			async function* mockStream() {
				yield new Uint8Array([65, 66, 67]); // "ABC"
				yield Buffer.from('DEF');
			}

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'mixed.txt',
				mimeType: 'text/plain',
				id: 'file-id',
			} as IBinaryData);
			mockContext.helpers.getBinaryStream.mockResolvedValue(mockStream() as unknown as Readable);

			const result = await getBinaryDataFile(mockContext, 0, 'data');

			expect(result.fileContent.toString()).toBe('ABCDEF');
			expect(Buffer.isBuffer(result.fileContent)).toBe(true);
		});
	});

	describe('Different item indices', () => {
		it('should work with different item indices', async () => {
			const fileBuffer = Buffer.from('content');
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'file.txt',
				mimeType: 'text/plain',
				id: undefined,
			} as IBinaryData);
			mockContext.helpers.getBinaryDataBuffer.mockResolvedValue(fileBuffer);

			await getBinaryDataFile(mockContext, 5, 'data');

			expect(mockContext.helpers.assertBinaryData).toHaveBeenCalledWith(5, 'data');
			expect(mockContext.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(5, 'data');
		});
	});

	describe('Different property names', () => {
		it('should work with custom binary property names', async () => {
			const fileBuffer = Buffer.from('content');
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.assertBinaryData.mockReturnValue({
				fileName: 'file.txt',
				mimeType: 'text/plain',
				id: undefined,
			} as IBinaryData);
			mockContext.helpers.getBinaryDataBuffer.mockResolvedValue(fileBuffer);

			await getBinaryDataFile(mockContext, 0, 'customProperty');

			expect(mockContext.helpers.assertBinaryData).toHaveBeenCalledWith(0, 'customProperty');
			expect(mockContext.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(0, 'customProperty');
		});
	});
});

describe('downloadAndPrepareBinaryData', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Successful downloads', () => {
		it('should download and prepare binary data from URL', async () => {
			const fileBuffer = Buffer.from('downloaded content');
			const preparedBinaryData = {
				data: 'base64-encoded-data',
				mimeType: 'image/jpeg',
				fileName: 'image.jpg',
			} as IBinaryData;

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: fileBuffer,
				headers: {
					'content-type': 'image/jpeg',
				},
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue(preparedBinaryData);

			const result = await downloadAndPrepareBinaryData(
				mockContext,
				'https://example.com/path/to/image.jpg',
			);

			expect(mockContext.helpers.httpRequest).toHaveBeenCalledWith({
				method: 'GET',
				url: 'https://example.com/path/to/image.jpg',
				encoding: 'arraybuffer',
				returnFullResponse: true,
			});
			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				fileBuffer,
				'image.jpg',
				'image/jpeg',
			);
			expect(result).toEqual(preparedBinaryData);
		});

		it('should work with IWebhookFunctions context', async () => {
			const fileBuffer = Buffer.from('content');
			const preparedBinaryData = {
				data: 'base64-data',
				mimeType: 'image/png',
				fileName: 'file.png',
			} as IBinaryData;

			const mockContext = mockDeep<IWebhookFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: fileBuffer,
				headers: {
					'content-type': 'image/png',
				},
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue(preparedBinaryData);

			const result = await downloadAndPrepareBinaryData(
				mockContext,
				'https://example.com/file.png',
			);

			expect(result).toEqual(preparedBinaryData);
		});
	});

	describe('Filename extraction', () => {
		it('should extract filename from simple URL', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: { 'content-type': 'image/png' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/photo.png');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'photo.png',
				'image/png',
			);
		});

		it('should extract filename from URL with nested path', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: { 'content-type': 'image/jpeg' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(
				mockContext,
				'https://cdn.example.com/user/123/images/photo.jpg',
			);

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'photo.jpg',
				'image/jpeg',
			);
		});

		it('should use "output" as fallback filename when URL has no filename', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: { 'content-type': 'application/octet-stream' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'output',
				'application/octet-stream',
			);
		});

		it('should handle URL with query parameters', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: { 'content-type': 'image/png' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(
				mockContext,
				'https://example.com/image.png?token=abc123&size=large',
			);

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'image.png',
				'image/png',
			);
		});

		it('should handle filename with URL-encoded characters', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: { 'content-type': 'image/jpeg' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/my-photo%20(1).jpg');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'my-photo%20(1).jpg',
				'image/jpeg',
			);
		});
	});

	describe('MIME type handling', () => {
		it('should extract mime type from content-type header', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: { 'content-type': 'video/mp4' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/video.mp4');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'video.mp4',
				'video/mp4',
			);
		});

		it('should handle content-type with charset', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/page.html');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'page.html',
				'text/html; charset=utf-8',
			);
		});

		it('should handle undefined content-type', async () => {
			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: Buffer.from('content'),
				headers: {},
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/file.bin');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'file.bin',
				undefined,
			);
		});
	});

	describe('Binary content handling', () => {
		it('should handle large binary files', async () => {
			const largeBuffer = Buffer.alloc(1024 * 1024); // 1MB
			largeBuffer.fill(0xff);

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: largeBuffer,
				headers: { 'content-type': 'application/octet-stream' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/large.bin');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				largeBuffer,
				'large.bin',
				'application/octet-stream',
			);
		});

		it('should preserve binary data integrity', async () => {
			const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: binaryData,
				headers: { 'content-type': 'image/png' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/image.png');

			const passedBuffer = mockContext.helpers.prepareBinaryData.mock.calls[0][0] as Buffer;
			expect(passedBuffer).toEqual(binaryData);
			expect(passedBuffer[0]).toBe(0x89);
		});

		it('should handle empty response', async () => {
			const emptyBuffer = Buffer.from('');

			const mockContext = mockDeep<IExecuteFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: emptyBuffer,
				headers: { 'content-type': 'text/plain' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue({} as IBinaryData);

			await downloadAndPrepareBinaryData(mockContext, 'https://example.com/empty.txt');

			expect(mockContext.helpers.prepareBinaryData).toHaveBeenCalledWith(
				emptyBuffer,
				'empty.txt',
				'text/plain',
			);
		});
	});

	describe('Real-world scenarios', () => {
		it('should download deAPI result image', async () => {
			const imageBuffer = Buffer.from('fake-image-data');
			const preparedData = {
				data: 'base64-image-data',
				mimeType: 'image/png',
				fileName: 'generated_123.png',
			} as IBinaryData;

			const mockContext = mockDeep<IWebhookFunctions>();
			mockContext.helpers.httpRequest.mockResolvedValue({
				body: imageBuffer,
				headers: { 'content-type': 'image/png' },
			});
			mockContext.helpers.prepareBinaryData.mockResolvedValue(preparedData);

			const result = await downloadAndPrepareBinaryData(
				mockContext,
				'https://storage.deapi.ai/results/user123/generated_123.png',
			);

			expect(mockContext.helpers.httpRequest).toHaveBeenCalledWith({
				method: 'GET',
				url: 'https://storage.deapi.ai/results/user123/generated_123.png',
				encoding: 'arraybuffer',
				returnFullResponse: true,
			});
			expect(result.fileName).toBe('generated_123.png');
			expect(result.mimeType).toBe('image/png');
		});
	});
});
