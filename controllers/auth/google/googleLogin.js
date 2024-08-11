// const { PrismaClient, AccessTypes } = require('@prisma/client');
// const prisma = new PrismaClient();
// const jwt = require('jsonwebtoken');
// const expressAsyncHandler = require('express-async-handler');
// const { ApiError } = require('../../../utils/error/ApiError');
// const { OAuth2Client } = require('google-auth-library');
// const createUser = require('../../../utils/user/createUser');
// const axios = require('axios');

// // Control Variables
// const sendMailFlag = true;

// //@description     Login or Register a User using Google
// //@route           POST /api/auth/googleLogin
// //@access          Public
// const googleLogin = expressAsyncHandler(async (req, res, next) => {
//     console.log("Entering google login");
//     const { access_token } = req.body;

//     if (!access_token) {
//         return next(new ApiError(400, "Missing fields: access_token"));
//     }

//     try {
//         // Verify the Google access token and get user info
//         const googleResponse = await axios.get(
//             `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
//         );

//         console.log("Google response:", googleResponse.data);

//         const { email, given_name, family_name, picture, hd } = googleResponse.data;


//         let user = await prisma.user.findUnique({
//             where: { email:email }
//         });

//         if (!user) {
//             // If user not found, register the user
//             let data = {
//                 name: given_name + " " + family_name,
//                 email,
//                 img: picture,
//             };

//             if (hd === 'kiit.ac.in') {
//                 data = { ...data, school: "Kalinga Institute Of Industrial Technology", rollNumber: email.split('@')[0] };
//             }

//             console.log("Data:", data);

//             user = await createUser(data, sendMailFlag);

//             if (!user) {
//                 return next(new ApiError(400, "Error creating user"));
//             }

//             console.log("User registered successfully:", user);
//         }

//         // Generate the JWT Token
//         const token = jwt.sign(
//             { id: user.id, email: user.email, loginTime: new Date().toISOString() },
//             process.env.JWT_SECRET,
//             { expiresIn: '7h' }
//         );

//         // Send the token as an HTTP-only cookie
//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict',
//         });

//         // Delete the password field before sending the data
//         delete user.password;

//         // Respond to the client
//         res.status(200).json({
//             message: "LOGGED IN",
//             user,
//             token
//         });

//         console.log(`Successfully ${user.id ? "LOGGED IN" : "registered"} through Google! -> ${user.email}`);
//     }
//     catch (error) {
//         if (error.response) {
//             // Error response from the Google API
//             const { status, data } = error.response;
//             console.error("Google API Error:", data);
//             next(new ApiError(status || 500, data.error || "Google API error"));
//         } else if (error.request) {
//             // No response received from the Google API
//             console.error("Google API No Response:", error.request);
//             next(new ApiError(503, "No response from Google API"));
//         } else if (error.code === 'P1001') {
//             // Prisma database connection error
//             console.error("Database Connection Error:", error.message);
//             next(new ApiError(503, "Database connection error"));
//         } else {
//             // General error handling
//             console.error("Google API Request Error:", error.message);
//             next(new ApiError(500, "Internal server request"));
//         }
//     }

// });

// module.exports = { googleLogin };
