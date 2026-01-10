import { uploadSavFile, createSavFile, downloadBlobAsFile } from '../savService';
import { getApiUrl, handleApiResponse } from '../config';

// Mock the config module and global fetch
jest.mock('../config', () => ({
    getApiUrl: jest.fn((path) => `http://mock-api.com/${path}`),
    handleApiResponse: jest.fn(async (response) => {
        if (!response.ok) {
            throw new Error('API Error');
        }
        return response.json();
    }),
}));

// Mock global fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;
const mockHandleApiResponse = handleApiResponse as jest.Mock;

describe('savService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadSavFile', () => {
        it('should create FormData and call fetch with the correct parameters', async () => {
            const mockFile = new File(['file content'], 'test.sav', { type: 'application/octet-stream' });
            const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) };
            mockFetch.mockResolvedValue(mockResponse);
            
            await uploadSavFile(mockFile);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://mock-api.com/sav/upload',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData),
                })
            );
            
            // Check that the file was appended to the FormData
            const formData = (mockFetch.mock.calls[0][1].body as FormData);
            expect(formData.get('file')).toBe(mockFile);

            // It should also call handleApiResponse
            expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
        });

        it('should use FormData directly if provided', async () => {
            const formData = new FormData();
            const mockFile = new File(['content'], 'test.sav');
            formData.append('file', mockFile);
            
            const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) };
            mockFetch.mockResolvedValue(mockResponse);

            await uploadSavFile(formData);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://mock-api.com/sav/upload',
                expect.objectContaining({
                    method: 'POST',
                    body: formData,
                })
            );
            
            expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse);
        });
    });

    describe('createSavFile', () => {
        it('should call fetch with correct JSON body and handle blob response', async () => {
            const mockData = {
                data: [{ VAR1: 1 }],
                variables: [{ name: 'VAR1', type: 'NUMERIC' }],
            };
            const mockBlob = new Blob(['blob content']);
            const mockResponse = {
                ok: true,
                blob: () => Promise.resolve(mockBlob),
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            const result = await createSavFile(mockData as any);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://mock-api.com/sav/create',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mockData),
                })
            );
            
            expect(result).toBe(mockBlob);
        });

        it('should throw an error for a failed response', async () => {
            const mockData = { data: [], variables: [] };
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Server Error',
                text: () => Promise.resolve('Internal Server Error'),
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            await expect(createSavFile(mockData as any)).rejects.toThrow('Internal Server Error');
        });
    });

    describe('downloadBlobAsFile', () => {
        it('should create a link and click it to download the blob', () => {
            // Mock DOM and URL methods
            const mockBlob = new Blob(['blob content'], { type: 'application/octet-stream' });
            const mockUrl = 'blob:http://localhost/mock-url';
            
            window.URL.createObjectURL = jest.fn(() => mockUrl);
            window.URL.revokeObjectURL = jest.fn();
            
            const link = {
                href: '',
                download: '',
                click: jest.fn(),
                remove: jest.fn(),
            };
            document.createElement = jest.fn(() => link as any);
            document.body.appendChild = jest.fn();
            
            downloadBlobAsFile(mockBlob, 'test-file.sav');

            expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
            expect(link.href).toBe(mockUrl);
            expect(link.download).toBe('test-file.sav');
            expect(document.body.appendChild).toHaveBeenCalledWith(link);
            expect(link.click).toHaveBeenCalledTimes(1);
            expect(link.remove).toHaveBeenCalledTimes(1);
            expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
        });
    });
}); 