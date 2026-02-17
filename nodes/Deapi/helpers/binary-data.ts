import {
  IBinaryData,
  IExecuteFunctions,
  IWebhookFunctions,
} from "n8n-workflow";

/** Chunk size to use for streaming. 256Kb */
const CHUNK_SIZE = 256 * 1024;

/**
 * Gets the binary data file for the given item index and given property name.
 * Returns the file name, content type and the file content as a Buffer.
 */

export async function getBinaryDataFile(
	ctx: IExecuteFunctions,
	itemIdx: number,
	binaryPropertyData: string | IBinaryData,
) {
  const binaryData = ctx.helpers.assertBinaryData(itemIdx, binaryPropertyData);

  let fileContent: Buffer;

  if (binaryData.id) {
    // File is stored externally, get as stream and convert to buffer
    const stream = await ctx.helpers.getBinaryStream(binaryData.id, CHUNK_SIZE);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    fileContent = Buffer.concat(chunks);
  } else {
    // File is stored in memory, get directly as buffer
    fileContent = await ctx.helpers.getBinaryDataBuffer(itemIdx, binaryPropertyData);
  }

  return {
    filename: binaryData.fileName,
    contentType: binaryData.mimeType,
    fileContent,
  };
}

/**
 * Downloads a binary file from a URL and prepares it as n8n binary data.
 *
 * @param ctx - The execution or webhook context
 * @param resultUrl - The URL to download the file from
 * @returns Prepared binary data ready to be attached to workflow output
 */
export async function downloadAndPrepareBinaryData(
  ctx: IExecuteFunctions | IWebhookFunctions,
  resultUrl: string,
): Promise<IBinaryData> {
  // Download the binary file from the result URL
  const binaryData = await ctx.helpers.httpRequest({
    method: 'GET',
    url: resultUrl,
    encoding: 'arraybuffer',
    returnFullResponse: true,
  });

  // Extract filename from URL
  const urlPath = new URL(resultUrl).pathname;
  const filename = urlPath.split('/').pop() || 'output';

  // Determine mime type from content-type header
  const mimeType = binaryData.headers['content-type'];

  // Prepare and return binary data
  return await ctx.helpers.prepareBinaryData(
    binaryData.body as Buffer,
    filename,
    mimeType,
  );
}