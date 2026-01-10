import fs from 'fs';
import path from 'path';
import request from 'supertest';

// Dynamic control for sav-writer behavior in this suite
let throwInvalidName = false;

jest.mock('sav-writer', () => ({
  VariableType: { Numeric: 0, String: 1, Date: 2, DateTime: 3 },
  VariableAlignment: { Left: 0, Centre: 1, Right: 2 },
  VariableMeasure: { Nominal: 0, Ordinal: 1, Continuous: 2 },
  saveToFile: (filePath: string) => {
    if (throwInvalidName) {
      throw new Error('invalid variable name');
    }
    // Write a file so res.download can read it
    fs.writeFileSync(filePath, Buffer.from('dummy'));
  }
}));

import { app } from '../../app';

describe('savController branches', () => {
  const tmpDir = path.join(__dirname, '..', '..', '..', 'temp_branch_tests');

  beforeAll(() => {
    process.env.TEMP_DIR = tmpDir;
    if (!fs.existsSync(tmpDir)) { fs.mkdirSync(tmpDir, { recursive: true }); }
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      void 0;
    }
    delete process.env.TEMP_DIR;
  });

  beforeEach(() => {
    throwInvalidName = false;
  });

  it('uploadSavFile: returns 400 when no file uploaded', async () => {
    const res = await request(app).post('/api/sav/upload');
    expect(res.status).toBe(400);
    expect(res.text).toContain('No file uploaded');
  });

  it('createSavFile: returns 400 when all variables filtered out', async () => {
    const payload = {
      variables: [
        { name: 'x', type: 'WKDAY', width: 8 } // unsupported type -> filtered
      ],
      data: []
    };
    const res = await request(app)
      .post('/api/sav/create')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('createSavFile: maps invalid variable name error to 400', async () => {
    throwInvalidName = true;
    const payload = {
      variables: [
        { name: '1invalid', type: 'NUMERIC', width: 8, decimal: 0 }
      ],
      data: [{ '1invalid': 1 }]
    };

    const res = await request(app)
      .post('/api/sav/create')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    const errMsg = (typeof res.body === 'object' && res.body !== null && 'error' in res.body)
      ? String((res.body as { error: unknown }).error)
      : '';
    expect(errMsg.toLowerCase()).toContain('nama variabel');
  });

  it('createSavFile: still responds 200 even if unlink after download errors', async () => {
    const unlinkSpy = jest
      .spyOn(fs, 'unlink')
      // @ts-expect-error - mock implementation signature is fine for tests
      .mockImplementation((p: string, cb: (err?: NodeJS.ErrnoException | null) => void) => cb(new Error('unlink fail')));

    const payload = {
      variables: [
        { name: 'val', type: 'NUMERIC', width: 8, decimal: 0 }
      ],
      data: [{ val: 1 }]
    };

    const res = await request(app)
      .post('/api/sav/create')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(unlinkSpy).toHaveBeenCalled();

    unlinkSpy.mockRestore();
  });
});
