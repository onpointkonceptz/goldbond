// Booking Model
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true,
        default: () => 'MLAB' + Date.now() + Math.floor(Math.random() * 1000)
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    testType: {
        type: String,
        required: [true, 'Test type is required'],
        enum: ['blood', 'thyroid', 'diabetes', 'lipid', 'liver', 'kidney', 'vitamin', 'other']
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
        validate: {
            validator: function(date) {
                return date >= new Date().setHours(0, 0, 0, 0);
            },
            message: 'Appointment date must be in the future'
        }
    },
    appointmentTime: {
        type: String,
        required: [true, 'Appointment time is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        enum: ['home', 'lab1', 'lab2', 'lab3']
    },
    address: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
bookingSchema.index({ email: 1 });
bookingSchema.index({ appointmentDate: 1 });
bookingSchema.index({ bookingId: 1 });

// Update timestamp before save
bookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
    return this.appointmentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Method to send confirmation email (placeholder)
bookingSchema.methods.sendConfirmationEmail = async function() {
    // In production, integrate with email service (SendGrid, Nodemailer, etc.)
    console.log(`Sending confirmation email to ${this.email} for booking ${this.bookingId}`);
    return true;
};

// Method to send SMS notification (placeholder)
bookingSchema.methods.sendSMSNotification = async function() {
    // In production, integrate with SMS service (Twilio, etc.)
    console.log(`Sending SMS to ${this.phone} for booking ${this.bookingId}`);
    return true;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;