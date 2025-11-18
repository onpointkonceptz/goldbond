// Contact Routes
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Submit contact form
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        // Create new contact message
        const contact = new Contact({
            name,
            email,
            phone,
            subject,
            message
        });
        
        await contact.save();
        
        // In production, send notification to admin
        console.log(`New contact message from ${name} (${email})`);
        
        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!',
            contactId: contact._id
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit contact form',
            errors: error.errors
        });
    }
});

// Get all contact messages (Admin only - add authentication in production)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        
        let query = {};
        if (status) {
            query.status = status;
        }
        
        const contacts = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Contact.countDocuments(query);
        
        res.json({
            success: true,
            contacts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact messages',
            error: error.message
        });
    }
});

// Get contact by ID
router.get('/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }
        
        res.json({
            success: true,
            contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact message',
            error: error.message
        });
    }
});

// Update contact status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['new', 'in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Status updated successfully',
            contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
});

// Mark contact as responded
router.patch('/:id/respond', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }
        
        await contact.markAsResponded();
        
        res.json({
            success: true,
            message: 'Marked as responded',
            contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark as responded',
            error: error.message
        });
    }
});

// Delete contact message
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Contact message deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete contact message',
            error: error.message
        });
    }
});

module.exports = router;