const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../utils/error/ApiError');

//@description     Login a User
//@route           POST /api/auth/login
//@access          Registered User
const login = expressAsyncHandler(async (req, res, next) => {
    // const { email, password } = req.body;

    try {
        // const user = await prisma.user.findUnique({
        //     where: { email }
        // });

        // if (!user) {
        //     return next(new ApiError(404, 'User not found'));
        // }

        const isPasswordValid = await bcrypt.compare(req.body.password, req.user.password);

        if (!isPasswordValid) {
            return next(new ApiError(401, 'Invalid password'));
        }

        // Generate the JWT Token with only id, email, and login time
        const token = jwt.sign({ id: req.user.id, email: req.user.email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });

        // Send the token as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
            // maxAge: 3600000 // 1 hour in milliseconds
        });

        //delete the password field before sending the data
        delete req.user.password

        res.status(200).json({ message: "LOGGED IN", user: req.user, token: token });
        console.log(`Successfully LOGGEDIN !! -> ${req.user.email}`);
    } catch (error) {
        next(error);
    }
});

module.exports = { login };


// lab programs 
/*
apply quick sort 

first/last/middle element as pivot 
random position as the pivot
median 3 as the pivot 

case 
random generate d 1000
sorted 1000
reversly sorted 1000
record the number of comparison for each case 
 */