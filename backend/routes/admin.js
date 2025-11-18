/**
 * Admin Routes for GOLDBOND LABORATORIES
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
const TestResult = require('../models/TestResult');
const { adminAuth } = require('../middleware/auth');

const generateToken = (user, expiresIn = '24h') => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn }
    );
};

// ---------------------- ADMIN LOGIN ----------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password required' });

        const admin = await User.findOne({
            email: email.toLowerCase(),
            role: { $in: ['admin', 'super_admin'] },
            status: 'active'
        });

        if (!admin)
            return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const isValid = await admin.comparePassword(password);
        if (!isValid)
            return res.status(401).json({ success: false, message: 'Invalid email or password' });

        admin.lastLogin = new Date();
        await admin.save();

        const token = generateToken(admin, remember ? '30d' : '8h');

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                name: `${admin.firstName} ${admin.lastName}`,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ---------------------- DASHBOARD STATS ----------------------
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
        const activePatients = await User.countDocuments({ status: 'active', role: 'user' });
        const totalResults = await TestResult.countDocuments();
        const pending = await TestResult.countDocuments({ status: 'pending' });
        const completed = await TestResult.countDocuments({ status: 'completed' });

        res.json({
            success: true,
            stats: {
                activePatients,
                totalResults,
                pending,
                completed
            }
        });
    } catch {
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
});

// ---------------------- LIST PATIENTS ----------------------
router.get('/patients', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const patients = await User.find({ role: 'user' })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('-password');

        const total = await User.countDocuments({ role: 'user' });

        res.json({
            success: true,
            patients,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch {
        res.status(500).json({ success: false, message: 'Error fetching patients' });
    }
});

// ---------------------- EDIT PATIENT ----------------------
router.put('/patients/:id', adminAuth, async (req, res) => {
    try {
        const update = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });

        if (!user)
            return res.status(404).json({ success: false, message: 'Patient not found' });

        res.json({ success: true, message: 'Patient updated', user });

    } catch {
        res.status(400).json({ success: false, message: 'Failed to update patient' });
    }
});

// ---------------------- DELETE PATIENT ----------------------
router.delete('/patients/:id', adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Patient deleted' });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to delete patient' });
    }
});

// ------------------------------------------------------------
// ---------------------- TEST RESULT MANAGEMENT --------------
// ------------------------------------------------------------

// List all results
router.get('/results', adminAuth, async (req, res) => {
    try {
        const results = await TestResult.find().sort({ createdAt: -1 });
        res.json({ success: true, results });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
});

// Edit/update result
router.put('/results/:reg', adminAuth, async (req, res) => {
    try {
        const update = { ...req.body, updatedAt: Date.now() };

        const result = await TestResult.findOneAndUpdate(
            { registrationNumber: req.params.reg },
            update,
            { new: true }
        );

        if (!result)
            return res.status(404).json({ success: false, message: 'Result not found' });

        res.json({ success: true, message: 'Result updated', result });

    } catch {
        res.status(400).json({ success: false, message: 'Update failed' });
    }
});

// Delete a result
router.delete('/results/:reg', adminAuth, async (req, res) => {
    try {
        const deleted = await TestResult.findOneAndDelete({ registrationNumber: req.params.reg });

        if (!deleted)
            return res.status(404).json({ success: false, message: 'Result not found' });

        res.json({ success: true, message: 'Result deleted' });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to delete result' });
    }
});

// View feedback for a test result
router.get('/results/:reg/feedback', adminAuth, async (req, res) => {
    try {
        const result = await TestResult.findOne({ registrationNumber: req.params.reg });

        if (!result)
            return res.status(404).json({ success: false, message: 'Result not found' });

        res.json({ success: true, feedback: result.feedback });

    } catch {
        res.status(500).json({ success: false, message: 'Failed to load feedback' });
    }
});

module.exports = router;
