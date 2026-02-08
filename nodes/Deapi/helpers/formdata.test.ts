import { generateFormdataBody } from './formdata';

describe('generateFormdataBody', () => {
  const boundary = '----TestBoundary12345';

  describe('Text fields only', () => {
    it('should generate correct format for single text field', () => {
      const result = generateFormdataBody(boundary, {
        prompt: 'A beautiful sunset',
      });
      const resultString = result.toString();

      expect(resultString).toContain(`--${boundary}\r\n`);
      expect(resultString).toContain('Content-Disposition: form-data; name="prompt"\r\n\r\n');
      expect(resultString).toContain('A beautiful sunset\r\n');
      expect(resultString).toContain(`--${boundary}--\r\n`);
    });

    it('should generate correct format for multiple text fields', () => {
      const result = generateFormdataBody(boundary, {
        prompt: 'A beautiful sunset',
        negative_prompt: 'blur, noise',
        steps: '10',
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="prompt"');
      expect(resultString).toContain('A beautiful sunset');
      expect(resultString).toContain('name="negative_prompt"');
      expect(resultString).toContain('blur, noise');
      expect(resultString).toContain('name="steps"');
      expect(resultString).toContain('10');
    });

    it('should handle empty text field value', () => {
      const result = generateFormdataBody(boundary, {
        empty_field: '',
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="empty_field"');
      expect(resultString).toContain(`--${boundary}\r\n`);
      expect(resultString).toContain(`--${boundary}--\r\n`);
    });

    it('should handle special characters in field values', () => {
      const result = generateFormdataBody(boundary, {
        text: 'Line 1\nLine 2\tTabbed',
      });
      const resultString = result.toString();

      expect(resultString).toContain('Line 1\nLine 2\tTabbed');
    });

    it('should handle Unicode characters in field values', () => {
      const result = generateFormdataBody(boundary, {
        text: 'Hello 世界 🌍',
      });
      const resultString = result.toString();

      expect(resultString).toContain('Hello 世界 🌍');
    });

    it('should handle quotes in field values', () => {
      const result = generateFormdataBody(boundary, {
        text: 'He said "Hello"',
      });
      const resultString = result.toString();

      expect(resultString).toContain('He said "Hello"');
    });
  });

  describe('Files only', () => {
    it('should generate correct format for single file', () => {
      const fileContent = Buffer.from('fake image data');
      const result = generateFormdataBody(boundary, {
        image: {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
          content: fileContent,
        },
      });
      const resultString = result.toString();

      expect(resultString).toContain(`--${boundary}\r\n`);
      expect(resultString).toContain('Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n');
      expect(resultString).toContain('Content-Type: image/jpeg\r\n\r\n');
      expect(result.includes(fileContent)).toBe(true);
      expect(resultString).toContain(`--${boundary}--\r\n`);
    });

    it('should generate correct format for multiple files', () => {
      const file1Content = Buffer.from('image data 1');
      const file2Content = Buffer.from('image data 2');
      const result = generateFormdataBody(boundary, {
        image1: {
          filename: 'photo1.jpg',
          contentType: 'image/jpeg',
          content: file1Content,
        },
        image2: {
          filename: 'photo2.png',
          contentType: 'image/png',
          content: file2Content,
        },
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="image1"; filename="photo1.jpg"');
      expect(resultString).toContain('Content-Type: image/jpeg');
      expect(resultString).toContain('name="image2"; filename="photo2.png"');
      expect(resultString).toContain('Content-Type: image/png');
      expect(result.includes(file1Content)).toBe(true);
      expect(result.includes(file2Content)).toBe(true);
    });

    it('should handle binary file content', () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const result = generateFormdataBody(boundary, {
        file: {
          filename: 'binary.dat',
          contentType: 'application/octet-stream',
          content: binaryContent,
        },
      });

      // Verify binary content is preserved
      expect(result.includes(binaryContent)).toBe(true);
    });

    it('should handle empty file content', () => {
      const result = generateFormdataBody(boundary, {
        file: {
          filename: 'empty.txt',
          contentType: 'text/plain',
          content: Buffer.from(''),
        },
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="file"; filename="empty.txt"');
      expect(resultString).toContain('Content-Type: text/plain');
    });
  });

  describe('Mixed fields and files', () => {
    it('should generate correct format with both fields and files', () => {
      const fileContent = Buffer.from('image data');
      const result = generateFormdataBody(boundary, {
        prompt: 'A cat',
        negative_prompt: 'blur',
        image: {
          filename: 'reference.jpg',
          contentType: 'image/jpeg',
          content: fileContent,
        },
      });
      const resultString = result.toString();

      // Verify text fields
      expect(resultString).toContain('name="prompt"');
      expect(resultString).toContain('A cat');
      expect(resultString).toContain('name="negative_prompt"');
      expect(resultString).toContain('blur');

      // Verify file
      expect(resultString).toContain('name="image"; filename="reference.jpg"');
      expect(resultString).toContain('Content-Type: image/jpeg');
      expect(result.includes(fileContent)).toBe(true);
    });

    it('should preserve insertion order of fields', () => {
      const result = generateFormdataBody(boundary, {
        field1: 'value1',
        file1: {
          filename: 'test.txt',
          contentType: 'text/plain',
          content: Buffer.from('content'),
        },
      });
      const resultString = result.toString();

      const field1Index = resultString.indexOf('name="field1"');
      const file1Index = resultString.indexOf('name="file1"');

      expect(field1Index).toBeLessThan(file1Index);
    });
  });

  describe('Null values', () => {
    it('should convert null values to empty string text fields', () => {
      const result = generateFormdataBody(boundary, {
        prompt: 'test',
        negative_prompt: null,
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="negative_prompt"\r\n\r\n');
      expect(resultString).toContain(`\r\n--${boundary}--`);
    });

    it('should handle all-null request', () => {
      const result = generateFormdataBody(boundary, {
        field1: null,
        field2: null,
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="field1"');
      expect(resultString).toContain('name="field2"');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request object', () => {
      const result = generateFormdataBody(boundary, {});
      const resultString = result.toString();

      expect(resultString).toBe(`--${boundary}--\r\n`);
    });

    it('should handle custom boundary strings', () => {
      const customBoundary = '----CustomBoundaryXYZ';
      const result = generateFormdataBody(customBoundary, {
        test: 'value',
      });
      const resultString = result.toString();

      expect(resultString).toContain(`--${customBoundary}\r\n`);
      expect(resultString).toContain(`--${customBoundary}--\r\n`);
    });

    it('should handle field names with special characters', () => {
      const result = generateFormdataBody(boundary, {
        'field_name-123': 'value',
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="field_name-123"');
    });

    it('should handle filenames with special characters', () => {
      const result = generateFormdataBody(boundary, {
        file: {
          filename: 'my-file (1).jpg',
          contentType: 'image/jpeg',
          content: Buffer.from('data'),
        },
      });
      const resultString = result.toString();

      expect(resultString).toContain('filename="my-file (1).jpg"');
    });
  });

  describe('Multipart format compliance', () => {
    it('should use CRLF (\\r\\n) line endings', () => {
      const result = generateFormdataBody(boundary, {
        test: 'value',
      });
      const resultString = result.toString();

      // Should contain \r\n after boundaries and headers
      expect(resultString).toContain(`--${boundary}\r\n`);
      expect(resultString).toContain(`--${boundary}--\r\n`);
      expect(resultString).toContain('name="test"\r\n\r\n');
    });

    it('should have correct boundary format', () => {
      const result = generateFormdataBody(boundary, {
        test: 'value',
      });
      const resultString = result.toString();

      // Opening boundaries start with --
      expect(resultString).toContain(`--${boundary}\r\n`);
      // Closing boundary ends with --
      expect(resultString).toContain(`--${boundary}--\r\n`);
    });

    it('should have empty line between headers and content', () => {
      const result = generateFormdataBody(boundary, {
        test: 'value',
      });
      const resultString = result.toString();

      // Headers should be followed by \r\n\r\n (empty line)
      expect(resultString).toContain('name="test"\r\n\r\n');
    });

    it('should end file content with CRLF before next boundary', () => {
      const result = generateFormdataBody(boundary, {
        file: {
          filename: 'test.txt',
          contentType: 'text/plain',
          content: Buffer.from('content'),
        },
      });

      // File content should be followed by \r\n before closing boundary
      const expected = Buffer.concat([
        Buffer.from('content'),
        Buffer.from('\r\n'),
        Buffer.from(`--${boundary}--\r\n`),
      ]);

      expect(result.includes(expected)).toBe(true);
    });

    it('should return a Buffer instance', () => {
      const result = generateFormdataBody(boundary, {
        test: 'value',
      });

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('Real-world scenarios', () => {
    it('should generate valid format for video prompt booster request', () => {
      const imageData = Buffer.from('fake-image-binary-data');
      const result = generateFormdataBody(boundary, {
        prompt: 'A cinematic video sequence',
        negative_prompt: 'blur, darkness',
        image: {
          filename: 'reference.jpg',
          contentType: 'image/jpeg',
          content: imageData,
        },
      });
      const resultString = result.toString();

      // Verify complete structure
      expect(resultString).toMatch(/--.*TestBoundary.*\r\n/);
      expect(resultString).toContain('Content-Disposition: form-data; name="prompt"');
      expect(resultString).toContain('A cinematic video sequence');
      expect(resultString).toContain('Content-Disposition: form-data; name="negative_prompt"');
      expect(resultString).toContain('blur, darkness');
      expect(resultString).toContain('Content-Disposition: form-data; name="image"; filename="reference.jpg"');
      expect(resultString).toContain('Content-Type: image/jpeg');
      expect(result.includes(imageData)).toBe(true);
    });

    it('should handle large file content', () => {
      const largeContent = Buffer.alloc(1024 * 100); // 100KB
      largeContent.fill(0xFF);

      const result = generateFormdataBody(boundary, {
        file: {
          filename: 'large.bin',
          contentType: 'application/octet-stream',
          content: largeContent,
        },
      });

      // Verify large content is included
      expect(result.includes(largeContent)).toBe(true);
      expect(result.length).toBeGreaterThan(100 * 1024);
    });
  });
});
