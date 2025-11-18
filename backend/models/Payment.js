const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // User Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Booking/Test Information
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    
    // Payment Details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    currency: {
        type: String,
        default: 'NGN',
        enum: ['NGN', 'USD', 'EUR', 'GBP']
    },
    
    // Payment Method
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'bank_transfer', 'ussd', 'qr', 'mobile_money', 'cash']
    },
    
    // Payment Provider (for online payments)
    paymentProvider: {
        type: String,
        enum: ['paystack', 'flutterwave', 'stripe', 'cash', 'bank_transfer'],
        default: 'paystack'
    },
    
    // Payment Status
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    
    // Transaction Information
    transactionId: {
        type: String,
        unique: true,
        sparse: true // Allows null values but ensures uniqueness when present
    },
    
    reference: {
        type: String,
        unique: true,
        required: true
    },
    
    // Provider Response
    providerResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Payment Dates
    paidAt: {
        type: Date
    },
    
    dueDate: {
        type: Date
    },
    
    // Additional Information
    description: {
        type: String,
        default: ''
    },
    
    notes: {
        type: String,
        default: ''
    },
    
    // Refund Information
    refundAmount: {
        type: Number,
        default: 0
    },
    
    refundedAt: {
        type: Date
    },
    
    refundReason: {
        type: String,
        default: ''
    },
    
    // Payment Verification
    verified: {
        type: Boolean,
        default: false
    },
    
    verifiedAt: {
        type: Date
    },
    
    // Failed Payment Information
    failureReason: {
        type: String,
        default: ''
    },
    
    retryCount: {
        type: Number,
        default: 0
    },
    
    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ reference: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for payment age
paymentSchema.virtual('paymentAge').get(function() {
    if (this.paidAt) {
        return Math.floor((Date.now() - this.paidAt.getTime()) / (1000 * 60 * 60 * 24));
    }
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: this.currency || 'NGN'
    }).format(this.amount);
});

// Pre-save middleware to generate reference if not provided
paymentSchema.pre('save', function(next) {
    if (!this.reference) {
        this.reference = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    // Set paidAt when status changes to completed
    if (this.status === 'completed' && !this.paidAt) {
        this.paidAt = new Date();
        this.verified = true;
        this.verifiedAt = new Date();
    }
    
    // Set refundedAt when status changes to refunded
    if (this.status === 'refunded' && !this.refundedAt) {
        this.refundedAt = new Date();
    }
    
    next();
});

// Static method to find pending payments older than specified days
paymentSchema.statics.findOldPendingPayments = function(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.find({
        status: 'pending',
        createdAt: { $lt: cutoffDate }
    });
};

// Instance method to mark payment as completed
paymentSchema.methods.markAsCompleted = function(transactionId, providerResponse = {}) {
    this.status = 'completed';
    this.transactionId = transactionId;
    this.providerResponse = providerResponse;
    this.paidAt = new Date();
    this.verified = true;
    this.verifiedAt = new Date();
    return this.save();
};

// Instance method to mark payment as failed
paymentSchema.methods.markAsFailed = function(reason, providerResponse = {}) {
    this.status = 'failed';
    this.failureReason = reason;
    this.providerResponse = providerResponse;
    this.retryCount += 1;
    return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
    if (this.status !== 'completed') {
        throw new Error('Can only refund completed payments');
    }
    
    if (amount > this.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
    }
    
    this.status = 'refunded';
    this.refundAmount = amount;
    this.refundReason = reason;
    this.refundedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);