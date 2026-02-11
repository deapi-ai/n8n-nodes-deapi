import { generateFormdataBody } from './formdata';

describe('generateFormdataBody', () => {
  const boundary = '----TestBoundary12345';

  describe('text fields', () => {
    it.each([
      ['single field', { prompt: 'A beautiful sunset' }, ['name="prompt"', 'A beautiful sunset']],
      ['empty value', { empty_field: '' }, ['name="empty_field"']],
      ['special characters', { text: 'Line 1\nLine 2\tTabbed' }, ['Line 1\nLine 2\tTabbed']],
      ['unicode', { text: 'Hello 世界 🌍' }, ['Hello 世界 🌍']],
      ['quotes', { text: 'He said "Hello"' }, ['He said "Hello"']],
    ])('should handle %s', (_name, input, expected) => {
      const result = generateFormdataBody(boundary, input).toString();
      expected.forEach((str) => expect(result).toContain(str));
    });

    it('should handle multiple fields', () => {
      const result = generateFormdataBody(boundary, {
        prompt: 'A beautiful sunset',
        negative_prompt: 'blur, noise',
        steps: '10',
      }).toString();

      expect(result).toContain('name="prompt"');
      expect(result).toContain('name="negative_prompt"');
      expect(result).toContain('name="steps"');
    });
  });

  describe('file fields', () => {
    it('should generate correct format for file', () => {
      const fileContent = Buffer.from('fake image data');
      const result = generateFormdataBody(boundary, {
        image: { filename: 'test.jpg', contentType: 'image/jpeg', content: fileContent },
      });

      const resultString = result.toString();
      expect(resultString).toContain('name="image"; filename="test.jpg"');
      expect(resultString).toContain('Content-Type: image/jpeg');
      expect(result.includes(fileContent)).toBe(true);
    });

    it('should handle multiple files', () => {
      const file1 = Buffer.from('image data 1');
      const file2 = Buffer.from('image data 2');
      const result = generateFormdataBody(boundary, {
        image1: { filename: 'photo1.jpg', contentType: 'image/jpeg', content: file1 },
        image2: { filename: 'photo2.png', contentType: 'image/png', content: file2 },
      });

      expect(result.includes(file1)).toBe(true);
      expect(result.includes(file2)).toBe(true);
    });

    it.each([
      ['binary content', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'application/octet-stream'],
      ['empty content', Buffer.from(''), 'text/plain'],
    ])('should handle %s', (_name, content, contentType) => {
      const result = generateFormdataBody(boundary, {
        file: { filename: 'test.dat', contentType, content },
      });
      expect(result.includes(content)).toBe(true);
    });
  });

  describe('mixed fields and files', () => {
    it('should handle both text fields and files', () => {
      const fileContent = Buffer.from('image data');
      const result = generateFormdataBody(boundary, {
        prompt: 'A cat',
        image: { filename: 'ref.jpg', contentType: 'image/jpeg', content: fileContent },
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="prompt"');
      expect(resultString).toContain('A cat');
      expect(resultString).toContain('name="image"; filename="ref.jpg"');
      expect(result.includes(fileContent)).toBe(true);
    });

    it('should preserve insertion order', () => {
      const result = generateFormdataBody(boundary, {
        field1: 'value1',
        file1: { filename: 'test.txt', contentType: 'text/plain', content: Buffer.from('content') },
      }).toString();

      expect(result.indexOf('name="field1"')).toBeLessThan(result.indexOf('name="file1"'));
    });
  });

  describe('null values', () => {
    it('should convert null to empty string', () => {
      const result = generateFormdataBody(boundary, {
        prompt: 'test',
        negative_prompt: null,
      }).toString();

      expect(result).toContain('name="negative_prompt"\r\n\r\n');
    });
  });

  describe('edge cases', () => {
    it.each([
      ['empty request', {}, `--${boundary}--\r\n`],
      ['field name with special chars', { 'field_name-123': 'value' }, 'name="field_name-123"'],
    ])('should handle %s', (_name, input, expected) => {
      const result = generateFormdataBody(boundary, input).toString();
      expect(result).toContain(expected);
    });

    it('should handle custom boundary', () => {
      const custom = '----CustomBoundaryXYZ';
      const result = generateFormdataBody(custom, { test: 'value' }).toString();

      expect(result).toContain(`--${custom}\r\n`);
      expect(result).toContain(`--${custom}--\r\n`);
    });

    it('should handle filename with special characters', () => {
      const result = generateFormdataBody(boundary, {
        file: { filename: 'my-file (1).jpg', contentType: 'image/jpeg', content: Buffer.from('data') },
      }).toString();

      expect(result).toContain('filename="my-file (1).jpg"');
    });
  });

  describe('multipart format compliance', () => {
    it('should use correct CRLF format and structure', () => {
      const result = generateFormdataBody(boundary, { test: 'value' }).toString();

      expect(result).toContain(`--${boundary}\r\n`);
      expect(result).toContain(`--${boundary}--\r\n`);
      expect(result).toContain('name="test"\r\n\r\n');
    });

    it('should end file content with CRLF before closing boundary', () => {
      const result = generateFormdataBody(boundary, {
        file: { filename: 'test.txt', contentType: 'text/plain', content: Buffer.from('content') },
      });

      const expected = Buffer.concat([
        Buffer.from('content'),
        Buffer.from('\r\n'),
        Buffer.from(`--${boundary}--\r\n`),
      ]);
      expect(result.includes(expected)).toBe(true);
    });

    it('should return a Buffer instance', () => {
      expect(Buffer.isBuffer(generateFormdataBody(boundary, { test: 'value' }))).toBe(true);
    });
  });

  describe('real-world scenario', () => {
    it('should generate valid format for image generation request', () => {
      const imageData = Buffer.from('fake-image-binary-data');
      const result = generateFormdataBody(boundary, {
        prompt: 'A cinematic video sequence',
        negative_prompt: 'blur, darkness',
        image: { filename: 'reference.jpg', contentType: 'image/jpeg', content: imageData },
      });
      const resultString = result.toString();

      expect(resultString).toContain('name="prompt"');
      expect(resultString).toContain('A cinematic video sequence');
      expect(resultString).toContain('name="negative_prompt"');
      expect(resultString).toContain('name="image"; filename="reference.jpg"');
      expect(result.includes(imageData)).toBe(true);
    });

    it('should handle large file content', () => {
      const largeContent = Buffer.alloc(1024 * 100, 0xff);
      const result = generateFormdataBody(boundary, {
        file: { filename: 'large.bin', contentType: 'application/octet-stream', content: largeContent },
      });

      expect(result.includes(largeContent)).toBe(true);
      expect(result.length).toBeGreaterThan(100 * 1024);
    });
  });
});
