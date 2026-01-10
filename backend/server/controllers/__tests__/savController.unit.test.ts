import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

let throwGeneric = false;

jest.mock('sav-writer', () => ({
  VariableType: { Numeric: 0, String: 1, Date: 2, DateTime: 3 },
  VariableAlignment: { Left: 0, Centre: 1, Right: 2 },
  VariableMeasure: { Nominal: 0, Ordinal: 1, Continuous: 2 },
  saveToFile: (filePath: string) => {
    if (throwGeneric) {
      throw new Error('boom');
    }
    fs.writeFileSync(filePath, Buffer.from('ok'));
  }
}));

import { createSavFile, cleanupTempFiles, transformRecord, transformVariable } from '../savController';

describe('savController unit-level branches', () => {
  beforeEach(() => {
    throwGeneric = false;
  });

  it('createSavFile: handles res.download error path (500)', () => {
    const payload = {
      variables: [{ name: 'n', type: 'NUMERIC', width: 8, decimal: 0 }],
      data: [{ n: 1 }]
    };

    const req = { body: payload } as unknown as Request;
    const res: Partial<Response> & { statusCode: number; body: unknown } = { statusCode: 200, body: undefined };
    res.status = ((code: number) => { res.statusCode = code; return res as unknown as Response; }) as Response['status'];
    res.json = ((obj: unknown) => { res.body = obj; return res as unknown as Response; }) as Response['json'];
    res.send = ((txt: unknown) => { res.body = txt; return res as unknown as Response; }) as Response['send'];
    res.download = (jest.fn((_p: string, _n: string, cb: (err?: Error | null) => void) => cb(new Error('fail'))) as unknown) as Response['download'];

    createSavFile(req, res as Response);

    expect(res.statusCode).toBe(500);
    expect(String(res.body)).toContain('Terjadi kesalahan saat mengunduh file');
  });

  it('createSavFile: generic error returns 500 with details', () => {
    throwGeneric = true;

    const payload = {
      variables: [{ name: 'n', type: 'NUMERIC', width: 8, decimal: 0 }],
      data: [{ n: 1 }]
    };

    const req = { body: payload } as unknown as Request;
    const res: Partial<Response> & { statusCode: number; jsonBody: { error?: unknown; details?: unknown } | undefined } = { statusCode: 200, jsonBody: undefined };
    res.status = ((code: number) => { res.statusCode = code; return res as unknown as Response; }) as Response['status'];
    res.json = ((obj: unknown) => { res.jsonBody = obj as { error?: unknown; details?: unknown }; return res as unknown as Response; }) as Response['json'];
    res.send = (() => res as unknown as Response) as Response['send'];
    res.download = (() => res as unknown as Response) as Response['download'];

    createSavFile(req, res as Response);

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody?.error).toBe('Gagal membuat file .sav');
    expect(String(res.jsonBody?.details || '')).toContain('boom');
  });

  it('cleanupTempFiles: removes files older than 1h and keeps recent files', () => {
    const tempDir = path.join(__dirname, '..', '..', '..', 'temp_cleanup_tests');
    process.env.TEMP_DIR = tempDir;
    if (!fs.existsSync(tempDir)) { fs.mkdirSync(tempDir, { recursive: true }); }

    const oldFile = path.join(tempDir, 'old.tmp');
    const newFile = path.join(tempDir, 'new.tmp');
    fs.writeFileSync(oldFile, 'x');
    fs.writeFileSync(newFile, 'y');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(oldFile, twoHoursAgo, twoHoursAgo);

    cleanupTempFiles();

    expect(fs.existsSync(oldFile)).toBe(false);
    expect(fs.existsSync(newFile)).toBe(true);

    // cleanup
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { void 0; }
    delete process.env.TEMP_DIR;
  });

  it('transformRecord: ignores fields not in transformedVariables', () => {
    const vars = [transformVariable({ name: 'x', type: 'NUMERIC', width: 8 })];
    const out = transformRecord({ x: 1, y: 2 }, vars);
    expect(out).toHaveProperty('x');
    expect(out).not.toHaveProperty('y');
  });
});
