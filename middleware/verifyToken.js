const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { ApiError } = require('../utils/error/ApiError');

const verifyToken = async (req, res, next) => {
    console.log("VerifyToken middleware is being called");
    
    // Extract the token from cookies or headers
    console.log(req.headers);
    const tokenFromCookies = req.cookies?.token;
    const tokenFromHeaders = req.headers['authorization'];
    let token = tokenFromCookies || tokenFromHeaders;

    console.log("Token from cookies:", tokenFromCookies);
    console.log("Token from headers:", tokenFromHeaders);

    if (!token) {
        console.log("Token is null");
        return next(new ApiError(401, "Token is required"));
    }

    // Check if token starts with "Bearer " and remove the prefix
    if (token.startsWith("Bearer ")) {
        token = token.slice(7);
    }

    console.log("Extracted Token:", token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: '70h' });

        console.log("Token verified");
        console.log(decoded);

        const user = await prisma.user.findUnique({
            where: { email: decoded.email }
        });

        if (!user) {
            console.log("User not found");
            return next(new ApiError(404, "User not found"));
        }

        req.user = user;
        console.log("Token verified successfully");
        next();

    } catch (err) {
        console.log("Error during token verification:", err);
        if (err.name === 'TokenExpiredError') {
            console.log("Token has expired");
            return next(new ApiError(403, "Unauthorized: Token has expired", err));
        } else if (err.name === 'JsonWebTokenError') {
            console.log("Invalid token");
            return next(new ApiError(401, "Forbidden: Invalid token", err));
        } else {
            console.log("Unexpected error");
            return next(new ApiError(500, "Internal Server Error", err));
        }
    }
};

module.exports = { verifyToken };
