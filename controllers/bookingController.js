import User from "../models/UserSchema.js";
import Booking from '../models/BookingSchema.js';
import Doctor from '../models/DoctorSchema.js';
import axios from 'axios'; // Import axios for making HTTP requests

const CHAPA_AUTH_KEY = process.env.CHAPA_AUTH_KEY; // Ensure this is set in your .env file

export const getCheckOutSession = async (req, res) => {
    try {
        // Get current booked doctor
        const doctor = await Doctor.findById(req.params.doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        // Get current user
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Validate ticket price
        if (isNaN(doctor.ticketPrice)) {
            return res.status(400).json({ success: false, message: "Invalid ticket price" });
        }

        // Prepare Chapa payment data
        const totalAmount = doctor.ticketPrice; // Use the ticket price as the total amount
        const orderId = `order-${Date.now()}`; // Generate a unique order ID
        const currency = 'ETB'; // Ethiopian Birr

        // Initiate Chapa payment process
        const paymentResponse = await axios.post(
            "https://api.chapa.co/v1/transaction/initialize",
            {
                amount: totalAmount,
                currency: currency,
                email: user.email, // From UserSchema
                first_name: user.name, // From UserSchema
                phone_number: user.phone, // From UserSchema
                tx_ref: orderId, // Unique transaction reference
                return_url: `${process.env.CLIENT_SITE_URL}/checkout-success`, // Redirect URL after payment
            },
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_AUTH_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Create new booking
        const booking = new Booking({
            doctor: doctor._id,
            user: user._id,
            ticketPrice: doctor.ticketPrice.toString(), // Ensure ticketPrice is a string
            status: "pending", // Default status
            isPaid: true, // Mark as paid
        });

        await booking.save();

        // Return success response with Chapa payment data
        res.status(200).json({
            success: true,
            message: "Successfully initiated payment",
            chapaPayment: paymentResponse.data,
            booking: booking, // Return the created booking
        });
    } catch (err) {
        console.error("Error initiating payment:", err);
        res.status(500).json({ success: false, message: "Error initiating payment", error: err.message });
    }
};

// Payment route for Chapa (optional, if you want a separate endpoint)
export const acceptPayment = async (req, res) => {
    const { amount, currency, email, first_name, phone_number, tx_ref } = req.body;

    try {
        const response = await axios.post(
            "https://api.chapa.co/v1/transaction/initialize",
            {
                amount,
                currency,
                email,
                first_name,
                phone_number,
                tx_ref,
                return_url: `${process.env.CLIENT_SITE_URL}/checkout-success`, // Redirect URL after payment
            },
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_AUTH_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error response:', error.response.data);
            res.status(error.response.status).json({
                message: error.response.data,
            });
        } else {
            console.error('Error message:', error.message);
            res.status(500).json({
                message: 'Internal server error',
            });
        }
    }
};