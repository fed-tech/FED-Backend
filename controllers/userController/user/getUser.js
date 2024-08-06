const { PrismaClient, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');

//@description     Fetch Profile
//@route           GET /api/user/fetchProfile
//@access          USER
const fetchUser = expressAsyncHandler(async (req, res, next) => {
    try {

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });

        if (user.length === 0) {
            return next(new ApiError(404, 'User not found'));
        }

        delete user.password;

        res.status(200).json({ success: true, user: user });
        console.log("user details fetched successfully")
    } catch (error) {
        console.error('Error fetching user:', error);
        next(new ApiError(500, 'Error fetching user', error));
    }
});

module.exports = { fetchUser };
