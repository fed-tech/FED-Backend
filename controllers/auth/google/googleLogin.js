const { PrismaClient, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const { OAuth2Client } = require('google-auth-library');
const createUser = require('../../../utils/user/createUser');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Control Variables
const sendMailFlag = false;

//@description     Login or Register a User using Google
//@route           POST /api/auth/googleLogin
//@access          Public
const googleLogin = expressAsyncHandler(async (req, res, next) => {
    console.log("Entering google login")
    const { tokenId, email } = req.body;
    console.log(tokenId)

    if (!tokenId) {
        return next(new ApiError(400, "Missing fields: tokenId"));
    }

    try {
        
        if (!email) {
            return next(new ApiError(404, 'User email not found'));
        }

        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // If user not found, register the user
            const data = { email, name, access: AccessTypes.USER };

            // Create or update the unique user
            user = await createUser(data, sendMailFlag);

            if (!user) {
                return next(new ApiError(400, "Error creating user"));
            }

            console.log("User registered successfully:", user);
        }

        // Generate the JWT Token with only id, email, and login time
        const token = jwt.sign(
            { id: user.id, email: user.email, loginTime: new Date().toISOString() },
            process.env.JWT_SECRET,
            { expiresIn: '7h' }
        );

        // Send the token as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
            // maxAge: 3600000 // 1 hour in milliseconds
        });

        // Delete the password field before sending the data
        delete user.password;

        res.status(200).json({ message: user.id ? "LOGGED IN" : "User created successfully", user, token });
        console.log(`Successfully ${user.id ? "LOGGED IN" : "registered"} through Google! -> ${user.email}`);
    } catch (error) {
        next(error);
    }
});

module.exports = { googleLogin };
