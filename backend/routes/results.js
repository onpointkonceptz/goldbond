// Test Results Routes
const express = require('express');
const path = require('path');
const router = express.Router();
const TestResult = require('../models/TestResult');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Master upload folder
const PUBLIC_UPLOAD_URL = '/uploads/';

// Normalize stored PDF paths
function normalizePdfPath(filePath) {
    if (!filePath) return null;
    const fileName = path.basename(filePath);
    return PUBLIC_UPLOAD_URL + fileName;
}

// Format a single result
function formatResultDoc(result) {
    if (!result) return null;
    const obj = result.toObject ? result.toObject() : result;
    obj.reportUrl = normalizePdfPath(obj.reportPdfUrl);
    return obj;
}

// Format array
function formatResultArray(results) {
    return results.map(formatResultDoc);
}

// ==============================
// PUBLIC LOGIN FOR RESULT VIEW
// ==============================
router.post('/login', async (req, res) => {
    try {
        const { registrationNumber, phone } = req.body;

        if (!registrationNumber || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Registration number and phone are required'
            });
        }

        const result = await TestResult.findByCredentials(registrationNumber, phone);
        await result.markAsViewed();

        res.json({
            success: true,
            message: 'Test result found',
            result: formatResultDoc(result)
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message || 'No results found'
        });
    }
});

// ==============================
// CREATE NEW TEST RESULT
// ==============================
router.post('/', async (req, res) => {
    try {
        const data = { ...req.body };

        if (data.reportPdfUrl) {
            const fileName = path.basename(data.reportPdfUrl);
            data.reportPdfUrl = PUBLIC_UPLOAD_URL + fileName;
        }

        const result = new TestResult(data);

        // Link to user if found
        try {
            const orConditions = [];
            if (result.email) orConditions.push({ email: result.email.toLowerCase() });
            if (result.phone) orConditions.push({ phone: result.phone });

            if (orConditions.length > 0) {
                const user = await User.findOne({ $or: orConditions });
                if (user) {
                    result.patientId = user._id;
                    user.testResults.push(result._id);
                    await user.save();
                }
            }
        } catch {}

        await result.save();
        await result.sendResultNotification();

        res.status(201).json({
            success: true,
            message: 'Result created successfully',
            result: formatResultDoc(result)
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create result'
        });
    }
});

// ==============================
// GET RESULTS
// ==============================
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const results = await TestResult.find()
            .sort({ reportDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await TestResult.countDocuments();

        res.json({
            success: true,
            results: formatResultArray(results),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
});

// Logged-in user
router.get('/user-results', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const results = await TestResult.find({ patientId: userId }).sort({ reportDate: -1 });

        res.json({
            success: true,
            count: results.length,
            results: formatResultArray(results)
        });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
});

// Patient ID
router.get('/patient/:id', async (req, res) => {
    try {
        const results = await TestResult.find({ patientId: req.params.id })
            .sort({ reportDate: -1 });

        res.json({
            success: true,
            count: results.length,
            results: formatResultArray(results)
        });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
});

// Search
router.get('/search', async (req, res) => {
    try {
        const q = {};
        if (req.query.patientName) q.patientName = { $regex: req.query.patientName, $options: 'i' };
        if (req.query.phone) q.phone = req.query.phone;

        const results = await TestResult.find(q).sort({ reportDate: -1 });

        res.json({
            success: true,
            count: results.length,
            results: formatResultArray(results)
        });

    } catch {
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});

// Get by registration
router.get('/:reg', async (req, res) => {
    try {
        const result = await TestResult.findOne({ registrationNumber: req.params.reg });

        if (!result)
            return res.status(404).json({ success: false, message: 'Result not found' });

        res.json({ success: true, result: formatResultDoc(result) });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch result' });
    }
});

// ==============================
// UPDATE RESULT (Admin editing)
// ==============================
router.put('/:reg', async (req, res) => {
    try {
        const update = { ...req.body, updatedAt: Date.now() };

        if (update.reportPdfUrl) {
            const fileName = path.basename(update.reportPdfUrl);
            update.reportPdfUrl = PUBLIC_UPLOAD_URL + fileName;
        }

        const result = await TestResult.findOneAndUpdate(
            { registrationNumber: req.params.reg },
            update,
            { new: true }
        );

        if (!result)
            return res.status(404).json({ success: false, message: 'Result not found' });

        res.json({
            success: true,
            message: 'Result updated successfully',
            result: formatResultDoc(result)
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to update result' });
    }
});

// ==============================
// UPDATE STATUS
// ==============================
router.patch('/:reg/status', async (req, res) => {
    try {
        const result = await TestResult.findOneAndUpdate(
            { registrationNumber: req.params.reg },
            { status: req.body.status, updatedAt: Date.now() },
            { new: true }
        );

        if (!result)
            return res.status(404).json({ success: false, message: 'Result not found' });

        res.json({
            success: true,
            message: 'Status updated',
            result: formatResultDoc(result)
        });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// ==============================
// DELETE RESULT
// ==============================
router.delete('/:reg', async (req, res) => {
    try {
        const result = await TestResult.findOneAndDelete({ registrationNumber: req.params.reg });

        if (!result)
            return res.status(404).json({ success: false, message: 'Result not found' });

        res.json({ success: true, message: 'Result deleted' });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to delete result' });
    }
});

// ==============================
// USER FEEDBACK FOR RESULTS
// ==============================
router.post('/:reg/feedback', protect, async (req, res) => {
    try {
        const { message, rating } = req.body;

        const result = await TestResult.findOne({ registrationNumber: req.params.reg });
        if (!result)
            return res.status(404).json({ success: false, message: 'Result not found' });

        result.feedback.push({
            userId: req.user._id,
            message,
            rating,
            date: new Date()
        });

        await result.save();

        res.json({ success: true, message: 'Feedback submitted' });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
});

module.exports = router;
