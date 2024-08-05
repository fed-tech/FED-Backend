const { PrismaClient, OtpPurpose, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
// const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../utils/error/ApiError');
const createUser = require('../../utils/user/createUser');
const verifyOTP = require('../../utils/otp/verifyOtp');

// Control Variables
const sendMailFlag = false;
const includeExtraFlag = false;

//@description     Register a User
//@route           POST /api/auth/register
//@access          Public
const register = expressAsyncHandler(async (req, res, next) => {

    const { editProfileCount, regForm, otp, ...data } = req.body;
    const { email, password, name } = data;

    // Delete extra data
    !includeExtraFlag && req.body.extra ? delete data.extra : null;

    // Validate request body
    if (!email || !password || !name || !otp) {
        return next(new ApiError(400, "Missing required fields: email, password, name, otp"));
    }

    try {
        // Check if the user is already registered 
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            },
            select: {
                id: true
            }
        })

        if (existingUser) {
            console.log("User already existing with this email", existingUser);
            return next(new ApiError(400, "User already registerd with this email!!"))
        }
        // Verify OTP -> Assuming that unique user constraint is handled in verifyEmailController
        const isValidOTP = await verifyOTP(email, otp, OtpPurpose.EMAIL_VERIFICATION);

        // // Log the otp verification if on DEBUG mode
        // if (process.env.DEBUG === "true") {
        //     console.log(isValidOTP);
        //     if (isValidOTP.id) {
        //         console.log(isValidOTP.id);
        //     }
        // }

        // Check if the OTP verification has failed
        if (!isValidOTP.id) {
            return next(new ApiError(isValidOTP.status, isValidOTP.message));
        }
        //  Password is hashed from the frontend
        // // Hash the password
        // const hashedPassword = await bcrypt.hash(password, 10);
        // data.password = hashedPassword;

        // override the access type of the new user to USER
        data.access = AccessTypes.USER;
        data.editProfileCount = 5;

        // Create or update the unique user
        const newUser = await createUser(data, sendMailFlag);

        if (!newUser) {
            return next(new ApiError(400, "Error creating user"))
        }

        // Generate the JWT Token
        const token = jwt.sign({ id: newUser.id, email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });

        // Send the token as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true
        });


        // Delete the password before sending the new created user data 
        delete newUser.password;

        // Respond to the client immediately
        res.status(201).json({ message: 'User created successfully', user : newUser, token: token });

        // Log the registration success if in debug mode
        if (process.env.DEBUG === "true") {
            console.log(`${email} has registered successfully`);
        }

        // Delete the OTP
        new Promise((resolve, reject) => {
            prisma.otp.delete({
                where: { id: isValidOTP.id }
            }).then(() => {
                resolve();
            }).catch(error => {
                console.error('Error deleting OTP:', error);
                reject(error);
            });
        }).catch(error => {
            console.error('Failed to delete OTP in the background:', error);
        });
    } catch (error) {
        console.error('Error in registering user:', error);
        return next(new ApiError(500, 'Error in registering user', error));
    }
});

module.exports = { register };
