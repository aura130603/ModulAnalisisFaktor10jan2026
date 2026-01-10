import fs from 'fs';
import path from 'path';
import request from 'supertest';

// Mock sav-reader used by the service to avoid real SPSS parsing
let mockShouldThrow = false;
let mockMeta: unknown = { variables: 2 };
let mockRows: unknown[] = [{ a: 1 }, { b: 2 }];

jest.mock('sav-reader', () => ({
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
  }
}));

import { app } from '../../app';

describe('POST /api/sav/upload (integration)', () => {
  const fixturesDir = path.join(__dirname, '..', '..', '..', 'temp_fixtures');
  const dummySavPath = path.join(fixturesDir, 'dummy.sav');

  beforeAll(() => {
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    // Create a small dummy file to upload
    fs.writeFileSync(dummySavPath, Buffer.from('dummy-sav-content'));
  });

  afterAll(() => {
    try {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    } catch {
      void 0;
    }
  });

  beforeEach(() => {
    mockShouldThrow = false;
    mockMeta = { variables: 2 };
    mockRows = [{ a: 1 }, { b: 2 }];
  });

  it('should accept .sav upload and respond with parsed meta and rows', async () => {
    const res = await request(app)
      .post('/api/sav/upload')
      .attach('file', dummySavPath, { contentType: 'application/x-spss-sav' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ meta: mockMeta, rows: mockRows });
  });

  it('should return 500 when parsing fails', async () => {
    mockShouldThrow = true;
    const res = await request(app)
      .post('/api/sav/upload')
      .attach('file', dummySavPath, { contentType: 'application/x-spss-sav' });

    expect(res.status).toBe(500);
    expect(res.text).toContain('Error processing SAV file');
  });
});
