import { readTextFromClipboard } from '../services/services';

describe('ImportClipboard Services', () => {

    const originalClipboard = navigator.clipboard;

    afterEach(() => {
        // Restore original clipboard object after each test
        Object.defineProperty(navigator, 'clipboard', {
            value: originalClipboard,
            writable: true,
        });
    });

    it('should read text from clipboard successfully', async () => {
        const mockText = 'Hello, clipboard!';
        const mockClipboard = {
            readText: jest.fn().mockResolvedValue(mockText),
        };
        Object.defineProperty(navigator, 'clipboard', {
            value: mockClipboard,
            writable: true,
        });

        const text = await readTextFromClipboard();
        expect(text).toBe(mockText);
        expect(mockClipboard.readText).toHaveBeenCalledTimes(1);
    });

    it('should throw a user-friendly error if reading fails', async () => {
        const mockClipboard = {
            readText: jest.fn().mockRejectedValue(new Error('Permission denied')),
        };
        Object.defineProperty(navigator, 'clipboard', {
            value: mockClipboard,
            writable: true,
        });

        await expect(readTextFromClipboard()).rejects.toThrow('Could not read from clipboard. Permission might be denied or an unexpected error occurred.');
    });

    it('should throw an error if clipboard API is not supported', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            writable: true,
        });

        await expect(readTextFromClipboard()).rejects.toThrow('Clipboard API not available.');
    });
}); 