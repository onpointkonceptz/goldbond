const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        trim: true
    },

    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
    },

    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"]
    },

    role: {
        type: String,
        enum: ["user", "admin", "super_admin", "staff", "lab_technician"],
        default: "user"
    },

    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active"
    },

    dateOfBirth: Date,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    address: { type: String, trim: true },

    // Linked Test Results
    testResults: [
        { type: mongoose.Schema.Types.ObjectId, ref: "TestResult" }
    ],

    // Linked Bookings
    bookings: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }
    ],

    // NEW — User feedback about results
    feedback: [
        {
            resultId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TestResult"
            },
            message: { type: String, trim: true },
            rating: { type: Number, min: 1, max: 5 },
            createdAt: { type: Date, default: Date.now }
        }
        // Admin can view this, patient can add/remove
    ],

    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },

    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
});

// ===============================
// PASSWORD HASH BEFORE SAVE
// ===============================
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

// ===============================
// COMPARE PASSWORD
// ===============================
userSchema.methods.comparePassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// ===============================
// UPDATE LAST LOGIN
// ===============================
userSchema.methods.updateLastLogin = function () {
    this.lastLogin = Date.now();
    return this.save();
};

module.exports = mongoose.model("User", userSchema);
