import fs from 'fs';
import path from 'path';
import request from 'supertest';

// Mock sav-writer to avoid real file generation and to create a dummy file for download
let lastFilePath: string | undefined;
jest.mock('sav-writer', () => ({
  VariableType: { Numeric: 0, String: 1, Date: 2, DateTime: 3 },
  VariableAlignment: { Left: 0, Centre: 1, Right: 2 },
  VariableMeasure: { Nominal: 0, Ordinal: 1, Continuous: 2 },
  saveToFile: (filePath: string) => {
    lastFilePath = filePath;
    // Ensure the file exists so res.download can succeed
    fs.writeFileSync(filePath, Buffer.from('dummy-sav'));
  }
}));

import { app } from '../../app';

describe('POST /api/sav/create (integration)', () => {
  const tempDir = path.join(__dirname, '..', '..', '..', 'temp_test_integration');

  beforeAll(() => {
    process.env.TEMP_DIR = tempDir;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      void 0;
    }
    delete process.env.TEMP_DIR;
  });

  it('should validate payload and return a downloaded .sav file, then remove temp file', async () => {
    const payload = {
      variables: [
        { name: 'num', type: 'NUMERIC', width: 8, decimal: 0 }
      ],
      data: [
        { num: '1' },
        { num: 2 }
      ]
    };

    const res = await request(app)
      .post('/api/sav/create')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    const cd = res.headers['content-disposition'];
    expect(cd).toBeDefined();
    expect(String(cd)).toContain('attachment');
    expect(String(cd)).toContain('data.sav');

    // Allow async unlink in controller to run
    await new Promise((r) => setTimeout(r, 20));

    if (lastFilePath) {
      expect(fs.existsSync(lastFilePath)).toBe(false);
    }
  });

  it('should reject invalid payload with 400', async () => {
    const res = await request(app)
      .post('/api/sav/create')
      .set('Content-Type', 'application/json')
      .send({ variables: [] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
