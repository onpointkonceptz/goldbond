const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { adminAuth } = require("../middleware/auth");

// ===============================
// CREATE NEW BOOKING
// ===============================
router.post("/", async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();

        await booking.sendConfirmationEmail();
        await booking.sendSMSNotification();

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to create booking"
        });
    }
});

// ===============================
// GET ALL BOOKINGS (PAGINATION)
// ===============================
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const bookings = await Booking.find()
            .sort({ appointmentDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Booking.countDocuments();

        res.json({
            success: true,
            bookings,
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
            message: "Failed to fetch bookings"
        });
    }
});

// ===============================
// GET BOOKING BY ID
// ===============================
router.get("/:bookingId", async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.bookingId });
        if (!booking)
            return res.status(404).json({ success: false, message: "Booking not found" });

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch booking" });
    }
});

// ===============================
// UPDATE BOOKING STATUS
// ===============================
router.patch("/:bookingId/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!["pending", "confirmed", "completed", "cancelled"].includes(status))
            return res.status(400).json({ success: false, message: "Invalid status" });

        const booking = await Booking.findOneAndUpdate(
            { bookingId: req.params.bookingId },
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!booking)
            return res.status(404).json({ success: false, message: "Booking not found" });

        res.json({ success: true, message: "Status updated", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
});

// ===============================
// ADMIN — EDIT ANY BOOKING (FULL EDIT)
// ===============================
router.put("/:bookingId/edit", adminAuth, async (req, res) => {
    try {
        const booking = await Booking.findOneAndUpdate(
            { bookingId: req.params.bookingId },
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );

        if (!booking)
            return res.status(404).json({ success: false, message: "Booking not found" });

        res.json({
            success: true,
            message: "Booking updated successfully",
            booking
        });
    } catch (error) {
        res.status(400).json({ success: false, message: "Update failed" });
    }
});

// ===============================
// CANCEL BOOKING (USER)
// ===============================
router.delete("/:bookingId", async (req, res) => {
    try {
        const booking = await Booking.findOneAndUpdate(
            { bookingId: req.params.bookingId },
            { status: "cancelled", updatedAt: Date.now() },
            { new: true }
        );

        if (!booking)
            return res.status(404).json({ success: false, message: "Booking not found" });

        res.json({ success: true, message: "Booking cancelled", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Cancel failed" });
    }
});

// ===============================
// ADMIN — DELETE BOOKING COMPLETELY
// ===============================
router.delete("/:bookingId/admin", adminAuth, async (req, res) => {
    try {
        const booking = await Booking.findOneAndDelete({ bookingId: req.params.bookingId });

        if (!booking)
            return res.status(404).json({ success: false, message: "Booking not found" });

        res.json({
            success: true,
            message: "Booking permanently deleted"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Delete failed" });
    }
});

// ===============================
// GET BOOKINGS BY EMAIL
// ===============================
router.get("/user/:email", async (req, res) => {
    try {
        const bookings = await Booking.find({ email: req.params.email }).sort({
            appointmentDate: -1
        });

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user bookings"
        });
    }
});

// ===============================
// AVAILABLE SLOTS
// ===============================
router.get("/slots/:date", async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const location = req.query.location || "lab1";

        const bookings = await Booking.find({
            appointmentDate: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            },
            location,
            status: { $ne: "cancelled" }
        }).select("appointmentTime");

        const allSlots = [
            "07:00", "08:00", "09:00", "10:00", "11:00",
            "14:00", "15:00", "16:00", "17:00", "18:00"
        ];

        const booked = bookings.map(b => b.appointmentTime);
        const available = allSlots.filter(slot => !booked.includes(slot));

        res.json({
            success: true,
            date: req.params.date,
            location,
            availableSlots: available,
            bookedSlots: booked
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load slots" });
    }
});

module.exports = router;
