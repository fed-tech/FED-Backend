// const { PrismaClient, OtpPurpose, AccessTypes } = require('@prisma/client');
// const prisma = new PrismaClient();
// // const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const expressAsyncHandler = require('express-async-handler');
// const { ApiError } = require('../../../utils/error/ApiError');
// const createUser = require('../../../utils/user/createUser');
// const verifyOTP = require('../../../utils/otp/verifyOtp');

// // Control Variables
// const sendMailFlag = false;
// const includeExtraFlag = false;

// //@description     Register a User
// //@route           POST /api/auth/googleRegister
// //@access          Public
// const googleRegister = expressAsyncHandler(async (req, res, next) => {
//     console.log("Entering google register");
//     const { id, ...data } = req.body;
//     const { email, name } = data;

//     // Delete extra data
//     !includeExtraFlag && req.body.extra ? delete data.extra : null;

//     // Validate request body
//     if (!email || !name || !id) {
//         return next(new ApiError(400, "Missing required fields: email, name, id "));
//     }

//     try {
//         // Check if the user is already registered 
//         const existingUser = await prisma.user.findUnique({
//             where: {
//                 email: email
//             },
//             select: {
//                 id: true
//             }
//         })

//         if (existingUser) {
//             console.log("User already existing with this email", existingUser);
//             return next(new ApiError(400, "User already registerd with this email!!"))
//         }
        
//         //  Password is hashed from the frontend
//         // Hash the password
//         const id = await bcrypt.hash(id, 10);
//         data.password = id;

//         // override the access type of the new user to USER
//         data.access = AccessTypes.USER;

//         // Create or update the unique user
//         const newUser = await createUser(data, sendMailFlag);

//         if (!newUser) {
//             return next(new ApiError(400, "Error creating user"))
//         }

//         // Generate the JWT Token
//         const token = jwt.sign({ id: newUser.id, email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });

//         // Send the token as an HTTP-only cookie
//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: true
//         });


//         // Delete the password before sending the new created user data 
//         delete newUser.password;

//         // Respond to the client immediately
//         res.status(201).json({ message: 'User created successfully', user : newUser, token: token });
//         console.log("user registerd");
//         // Log the registration success if in debug mode
//         if (process.env.DEBUG === "true") {
//             console.log(`${email} has registered successfully`);
//         }
//     } catch (error) {
//         console.error('Error in registering user:', error);
//         return next(new ApiError(500, 'Error in registering user', error));
//     }
// });

// module.exports = { googleRegister };
