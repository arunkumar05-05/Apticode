"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const db_1 = require("./prisma/db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) {
            return callback(null, true);
        }
        if (origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.endsWith('vercel.app') ||
            origin.includes('apticode')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express_1.default.json());
// Mount the modular routes under /api
app.use('/api', api_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});
// Initialize database dynamically and start listener
(0, db_1.initDatabase)().then(() => {
    app.listen(PORT, () => {
        console.log(`[Server] AptiCode secure API gateway listening on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('[Server] Critical Database Initialization Error:', err);
    app.listen(PORT, () => {
        console.log(`[Server] AptiCode secure API gateway listening on http://localhost:${PORT} (Database offline fallback)`);
    });
});
