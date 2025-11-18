// Backend Server - Node.js with Express
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// MIDDLEWARE
// =========================
app.use(cors());

// Paystack webhook must receive raw body
app.use('/api/payments/webhook/paystack', express.raw({ type: 'application/json' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =========================
// DATABASE
// =========================
const connectDB = require('./config/database');
connectDB();

// =========================
// ROUTES
// =========================
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/results', require('./routes/results'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/upload', require('./routes/upload'));       // NEW UPLOAD SYSTEM

// =========================
// STATIC FILES
// =========================

// 🔥 MAIN UPLOADS ROOT FOLDER (medilab-website/uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// keeps support for certificates under frontend pages if you ever need them
app.use('/frontend/pages', express.static(path.join(__dirname, '../frontend/pages')));

// =========================
// HEALTH CHECK
// =========================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'GOLDBOND LABORATORIES API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            payments: 'enabled',
            bookings: 'enabled',
            results: 'enabled',
            auth: 'enabled'
        }
    });
});

// =========================
// API DOCS
// =========================
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'GOLDBOND LABORATORIES API',
        version: '1.0.0',
        description: 'API for GOLDBOND LABORATORIES management system',
        endpoints: {
            auth: {
                base: '/api/auth',
                routes: [
                    'POST /register',
                    'POST /login',
                    'GET /profile',
                    'PUT /profile'
                ]
            },
            bookings: {
                base: '/api/bookings',
                routes: [
                    'POST /',
                    'GET /user',
                    'GET /:id',
                    'PUT /:id',
                    'DELETE /:id'
                ]
            },
            payments: {
                base: '/api/payments',
                routes: [
                    'POST /initialize',
                    'POST /verify/:reference',
                    'GET /user',
                    'GET /:id',
                    'POST /webhook/paystack',
                    'GET /config/public-key'
                ]
            },
            results: {
                base: '/api/results',
                routes: [
                    'GET /user',
                    'GET /:id',
                    'POST /search'
                ]
            },
            contact: {
                base: '/api/contact',
                routes: ['POST /']
            }
        }
    });
});

// =========================
// API STATUS
// =========================
app.get('/api/status', async (req, res) => {
    try {
        res.json({
            status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            environment: {
                paystack_secret: !!process.env.PAYSTACK_SECRET_KEY,
                paystack_public: !!process.env.PAYSTACK_PUBLIC_KEY,
                jwt_secret: !!process.env.JWT_SECRET,
                mongodb_uri: !!process.env.MONGODB_URI
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// =========================
// PAYMENT CONFIG STATUS
// =========================
app.get('/api/payments/config/status', (req, res) => {
    res.json({
        provider: 'paystack',
        configured: !!process.env.PAYSTACK_SECRET_KEY,
        webhooks_enabled: true,
        supported_currencies: ['NGN', 'USD', 'EUR', 'GBP'],
        supported_methods: [
            'card',
            'bank_transfer',
            'ussd',
            'qr',
            'mobile_money',
            'cash'
        ],
        environment: process.env.NODE_ENV || 'development'
    });
});

// =========================
// ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            error: 'Duplicate field error',
            message: `${field} already exists`
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: Object.values(err.errors).map(e => e.message).join(', ')
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
});

// =========================
// 404 HANDLER
// =========================
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API route not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
    });
});

// =========================
// ROOT
// =========================
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to GOLDBOND LABORATORIES API',
        version: '1.0.0',
        status: 'running'
    });
});

// =========================
// FALLBACK
// =========================
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: 'This is an API server. Please use /api/* endpoints.'
    });
});

// =========================
// SHUTDOWN HANDLERS
// =========================
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Closing DB...');
    mongoose.connection.close(() => process.exit(0));
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Closing DB...');
    mongoose.connection.close(() => process.exit(0));
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🏥 GOLDBOND LABORATORIES API is ready!`);
    console.log(`📁 Uploads folder: /uploads`);
    console.log(`📚 Docs: http://localhost:${PORT}/api/docs`);
});

module.exports = app;
