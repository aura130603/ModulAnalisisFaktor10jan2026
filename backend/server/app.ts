import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { ALLOWED_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_ENABLED } from './config/constants';
import { savRouter } from './routes/savRoutes';


const app = express();

app.use(helmet());
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
}));
app.use(express.json());

// Global rate limiting (keyed by X-User-Id or IP)
if (RATE_LIMIT_ENABLED) {
    const apiLimiter = rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: express.Request) => {
            // Prefer header X-User-Id; fallback to IP. Always return string.
            const userIdHeader = req.headers['x-user-id'];
            const id = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
            return String(id ?? req.ip);
        }
    });
    app.use('/api', apiLimiter);
}

// Health check
app.get('/', (req: express.Request, res) => {
    res.status(200).send('Backend is running!');
});

app.use('/api/sav', savRouter);

export { app };