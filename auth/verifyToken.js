import jwt from 'jsonwebtoken';
import Doctor from '../models/DoctorSchema.js';
import User from '../models/UserSchema.js';

export const authenticate = async (req, res, next) => {
    // Get token from headers
    const authToken = req.headers.authorization;

    console.log("Authorization header:", authToken); // Debugging log

    // Check if the token exists
    if (!authToken || !authToken.startsWith('Bearer')) {
        return res.status(401).json({ success: false, message: "No token, authorization failed" });
    }

    try {
        const token = authToken.split(' ')[1];

        console.log("Extracted token:", token); // Debugging log

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        console.log("Decoded token payload:", decoded); // Debugging log

        // Use _id from the token payload
        req.userId = decoded._id; // Updated to use _id
        req.role = decoded.role;

        console.log("User ID from token:", req.userId); // Debugging log
        // Debugging log

        next();
    } catch (err) {
        console.error("Token verification error:", err); // Debugging log
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token is expired' });
        }
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

export const restrict = roles => async (req, res, next) => {
    const userId = req.userId;

    console.log("User ID from token:", userId); // Debugging log

    let user;

    try {
        const patient = await User.findById(userId);
        const doctor = await Doctor.findById(userId);

        console.log("Patient found:", patient); // Debugging log
        console.log("Doctor found:", doctor); // Debugging log

        if (patient) {
            user = patient;
        } else if (doctor) {
            user = doctor;
        } else {
            console.log("User not found in database"); // Debugging log
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log("User role:", user.role); // Debugging log

        if (!roles.includes(user.role)) {
            return res.status(403).json({ success: false, message: "You are not authorized" });
        }

        next();
    } catch (err) {
        console.error("Error in restrict middleware:", err); // Debugging log
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};