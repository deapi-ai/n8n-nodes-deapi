export interface FormdataFileValue {
	filename: string;
	contentType: string;
	content: Buffer;
}

type FormdataValue = string | number | boolean | FormdataFileValue | null;

/**
 * Generates a multipart/form-data body as a Buffer from a typed request object.
 * String, number, and boolean values become text fields, FormdataFileValue objects become file fields,
 * null values become empty string text fields.
 *
 * @param boundary - The boundary string to use for multipart/form-data
 * @param request - Object mapping field names to values
 * @returns A Buffer containing the complete multipart/form-data body
 */
export function generateFormdataBody(
	boundary: string,
	request: Record<string, FormdataValue>,
): Buffer {
	const parts: Buffer[] = [];

	for (const [name, value] of Object.entries(request)) {
		if (typeof value === 'object' && value !== null) {
			// File field
			parts.push(
				Buffer.from(
					`--${boundary}\r\n` +
						`Content-Disposition: form-data; name="${name}"; filename="${value.filename}"\r\n` +
						`Content-Type: ${value.contentType}\r\n\r\n`,
				),
			);
			parts.push(value.content);
			parts.push(Buffer.from('\r\n'));
		} else {
			// Text field (string, number, boolean, null)
			parts.push(
				Buffer.from(
					`--${boundary}\r\n` +
						`Content-Disposition: form-data; name="${name}"\r\n\r\n` +
						`${value ?? ''}\r\n`,
				),
			);
		}
	}

	// Add closing boundary
	parts.push(Buffer.from(`--${boundary}--\r\n`));

	return Buffer.concat(parts);
}
