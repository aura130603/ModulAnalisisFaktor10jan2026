import request from 'supertest';

import { app } from '../app';

describe('Test the root path', () => {
    it('should response the GET method', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Backend is running!');
    });
});

describe('Test the sav routes', () => {
    it('should response the GET method for /api/sav', async () => {
        const response = await request(app).get('/api/sav');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('OK');
    });
}); 