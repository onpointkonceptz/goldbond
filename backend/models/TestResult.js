// Test Result Model
const mongoose = require("mongoose");
const path = require("path");

const PUBLIC_UPLOAD_URL = "/uploads/";

const testResultSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    diagnosticNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Patient details
    patientName: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },

    // Test details
    testName: { type: String, required: true },
    testCategory: {
        type: String,
        required: true,
        enum: [
            "Hematology",
            "Biochemistry",
            "Microbiology",
            "Pathology",
            "Radiology",
            "Other"
        ]
    },

    sampleCollectionDate: { type: Date, required: true },
    reportDate: { type: Date, default: Date.now },

    testResults: [
        {
            parameter: String,
            value: String,
            unit: String,
            normalRange: String,
            flag: {
                type: String,
                enum: ["Normal", "High", "Low", "Critical"]
            }
        }
    ],

    overallSummary: { type: String, trim: true },
    doctorRemarks: { type: String, trim: true },
    pathologistName: { type: String, trim: true },
    pathologistSignature: { type: String },

    status: {
        type: String,
        enum: ["pending", "in-process", "completed", "verified"],
        default: "completed"
    },

    // Only the filename is stored
    reportPdfUrl: { type: String, trim: true },

    // Feedback system (NEW)
    feedback: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            message: { type: String, trim: true },
            rating: { type: Number, min: 1, max: 5 },
            createdAt: { type: Date, default: Date.now }
        }
    ],

    // Tracking
    isViewed: { type: Boolean, default: false },
    viewedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Normalize PDF filename before save
testResultSchema.pre("save", function (next) {
    this.updatedAt = Date.now();

    if (this.reportPdfUrl) {
        const fileName = path.basename(this.reportPdfUrl);
        this.reportPdfUrl = fileName;
    }

    next();
});

// Virtual full URL
testResultSchema.virtual("pdfUrl").get(function () {
    if (!this.reportPdfUrl) return null;
    return PUBLIC_UPLOAD_URL + this.reportPdfUrl;
});

// Mark result as viewed
testResultSchema.methods.markAsViewed = function () {
    if (!this.isViewed) {
        this.isViewed = true;
        this.viewedAt = Date.now();
        return this.save();
    }
    return this;
};

// Notification placeholder
testResultSchema.methods.sendResultNotification = function () {
    console.log(
        `Sending result notification to ${this.email || this.phone} for ${this.registrationNumber}`
    );
    return true;
};

// Public lookup
testResultSchema.statics.findByCredentials = async function (
    registrationNumber,
    phone
) {
    const result = await this.findOne({ registrationNumber, phone });
    if (!result) throw new Error("No results found with provided credentials");

    return result;
};

module.exports = mongoose.model("TestResult", testResultSchema);
