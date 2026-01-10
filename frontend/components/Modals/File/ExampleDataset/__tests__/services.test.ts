import { processSavFileFromUrl } from '../services/services';
import * as api from '@/services/api';

// Mock the API service
jest.mock('@/services/api');
const mockedUploadSavFile = api.uploadSavFile as jest.Mock;

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Example Dataset Services', () => {
    const filePath = '/exampleData/test.sav';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch a file, create FormData, and call uploadSavFile on success', async () => {
        // Arrange
        const mockBlob = new Blob(['sav-content'], { type: 'application/octet-stream' });
        const mockResponse = {
            ok: true,
            statusText: 'OK',
            blob: jest.fn().mockResolvedValue(mockBlob),
        };
        mockFetch.mockResolvedValue(mockResponse);
        
        const mockUploadResult = { success: true };
        mockedUploadSavFile.mockResolvedValue(mockUploadResult);

        // Act
        const result = await processSavFileFromUrl(filePath);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(filePath);
        expect(mockedUploadSavFile).toHaveBeenCalledTimes(1);

        const formData = mockedUploadSavFile.mock.calls[0][0] as FormData;
        const file = formData.get('file') as File;
        
        expect(file).toBeInstanceOf(File);
        expect(file.name).toBe('test.sav');
        
        // In Node.js test environment, the File object may not have the .text() or .arrayBuffer() method.
        // Reading content via FileReader is more reliable.
        const fileBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file as Blob);
        });

        const fileText = new TextDecoder().decode(fileBuffer as ArrayBuffer);
        expect(fileText).toBe('sav-content');
        
        expect(result).toEqual(mockUploadResult);
    });

    it('should throw an error if fetching the file fails', async () => {
        // Arrange
        const mockResponse = {
            ok: false,
            statusText: 'Not Found',
        };
        mockFetch.mockResolvedValue(mockResponse);

        // Act & Assert
        await expect(processSavFileFromUrl(filePath)).rejects.toThrow('Failed to fetch example file: Not Found');
        
        expect(mockedUploadSavFile).not.toHaveBeenCalled();
    });

    it('should use a default filename if path parsing fails', async () => {
        // Arrange
        const strangeFilePath = '/';
        const mockBlob = new Blob(['sav-content']);
        mockFetch.mockResolvedValue({
            ok: true,
            blob: jest.fn().mockResolvedValue(mockBlob),
        });

        // Act
        await processSavFileFromUrl(strangeFilePath);

        // Assert
        const formData = mockedUploadSavFile.mock.calls[0][0] as FormData;
        const file = formData.get('file') as File;
        expect(file.name).toBe('example.sav');
    });
}); 