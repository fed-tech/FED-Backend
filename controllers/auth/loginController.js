const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../utils/ApiError');

//@description     Login a User
//@route           POST /api/auth/login
//@access          Registered User
const login = expressAsyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.User.findUnique({
            where: { email }
        });

        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }
        if(process.env.DEBUG === true){
            console.log("User details in - ./controllers/auth/loginController -> login function \n", user)
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return next(new ApiError(401, 'Invalid password'));
        }

        // Generate the JWT Token with only id, email, and login time
        const token = jwt.sign({ id: user.id, email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '3h' });

        // Send the token as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
            // maxAge: 3600000 // 1 hour in milliseconds
        });

        // Construct the response object excluding password
        const userData = {
            id: user.id,
            email: user.email,
            access: user.access,
            name: user.name,
            year: user.year,
            rollNumber: user.rollNumber,
            school: user.school,
            college: user.college,
            contactNo: user.contactNo,
            whatsappNo: user.whatsappNo,
            regForm : user.regForm,
            member : user.member ? user.member : undefined
        };

        res.json({ status: "OK", message: "LOGGED IN", user: userData });
    } catch (error) {
        next(error);
    }
});

module.exports = { login };
