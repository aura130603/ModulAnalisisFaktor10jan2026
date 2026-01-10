import fs from 'fs';
import path from 'path';

import { processUploadedSav } from '../savService';

/**
 * Mock the external `sav-reader` dependency. The mock allows us to control
 * success and failure scenarios by toggling the value of the `mockShouldThrow`
 * variable inside each test.
 */
let mockShouldThrow = false;
let mockMeta: unknown = {};
let mockRows: unknown[] = [];

// Define mock inside factory function so it is available when Jest executes it (avoids TDZ)
jest.mock('sav-reader', () => {
  return {
    SavBufferReader: class {
      private buffer: Buffer;
      public meta: unknown;
      constructor(buffer: Buffer) {
        this.buffer = buffer;
        this.meta = mockMeta;
      }
      async open() {
        if (mockShouldThrow) {
          throw new Error('open failed');
        }
      }
      async readAllRows() {
        if (mockShouldThrow) {
          throw new Error('read failed');
        }
        return mockRows as unknown[];
      }
    },
  };
});

describe('savService.processUploadedSav', () => {
  const tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp_test');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockShouldThrow = false;
    mockMeta = { variables: 3 };
    mockRows = [{ a: 1 }, { b: 2 }];
  });

  it('should return meta and rows and delete the temporary file', async () => {
    const filePath = path.join(tempDir, 'dummy.sav');
    fs.writeFileSync(filePath, Buffer.from('dummy-data'));

    const result = await processUploadedSav(filePath);

    expect(result).toEqual({ meta: mockMeta, rows: mockRows });
    // wait for unlink callback to execute
    await new Promise((resolve) => setImmediate(resolve));
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('should delete temporary file and throw when SavBufferReader fails', async () => {
    mockShouldThrow = true;
    const filePath = path.join(tempDir, 'dummy2.sav');
    fs.writeFileSync(filePath, Buffer.from('dummy-data'));

    await expect(processUploadedSav(filePath)).rejects.toThrow('Error processing SAV file');
    await new Promise((resolve) => setImmediate(resolve));
    expect(fs.existsSync(filePath)).toBe(false);
  });
}); 