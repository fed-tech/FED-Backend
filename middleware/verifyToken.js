const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { ApiError } = require('../utils/ApiError');

const verifyToken = async (req, res, next) => {
    console.log("VerifyToken middleware is being called");
    
    const token = req.cookies.token;

    if (!token) {
        console.log("Token not provided");
        throw new ApiError(401, "Unauthorized: Token not provided");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: '70h' });

        console.log("Token verified");
        console.log(decoded);

        const user = await prisma.User.findUnique({
            where: { email: decoded.email } // Assuming 'email' is stored in the token payload
        });        

        if (!user) {
            console.log("User not found");
            throw new ApiError(404, "User not found");
        }

        req.user = user;
        next();

    } catch (err) {
        console.log("Error during token verification:", err);

        if (err.name === 'TokenExpiredError') {
            console.log("Token has expired");
            throw new ApiError(401, "Unauthorized: Token has expired");
        } else if (err.name === 'JsonWebTokenError') {
            console.log("Invalid token");
            throw new ApiError(403, "Forbidden: Invalid token");
        } else {
            console.log("Unexpected error");
            throw new ApiError(500, "Internal Server Error");
        }
    }
};

module.exports = { verifyToken };
