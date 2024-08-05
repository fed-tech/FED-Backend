const { PrismaClient, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const updateUser = require('../../../utils/user/updateUser');

// @description     Update User Details
// @route           PUT /api/user/update
// @access          Members and 5 times for USER
const editProfile = expressAsyncHandler(async (req, res, next) => {
    const { editProfileCount, email, password, access, github, linkedin, extra, ...rest } = req.body;
    console.log(req.user.access);
    console.log(rest);
    console.log("entering edit profile", extra);

    try {
        if (req.user.access === AccessTypes.USER && req.user.editProfileCount <= 0) {
            return next(new ApiError(400, "Edit profile limit exceeded. Try contacting fedkiit@gmail.com"));
        }

        let updatedExtra = {};
        
        if (req.user.access !== AccessTypes.USER) {
            // Check if req.user.extra is a proper JSON object
            if (req.user && typeof req.user.extra === 'object' && req.user.extra !== null) {
                updatedExtra = req.user.extra;
            }

            if (extra) {
                const { github, linkedin } = extra;
                // Update member object with new values
                if (github) updatedExtra.github = github;
                if (linkedin) updatedExtra.linkedin = linkedin;
            }

            console.log("modified extra", updatedExtra);
            rest.extra = updatedExtra;
        } else {
            rest.editProfileCount = req.user.editProfileCount - 1;
            if (rest && rest.extra) {
                delete rest.extra;
            }
        }

        // Update the user details
        const updatedUser = await updateUser({ email: req.user.email }, rest);

        // Remove sensitive information from updatedUser
        delete updatedUser.password;

        console.log("Updated user:", updatedUser);

        res.status(200).json({ message: 'User updated successfully', data: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return next(new ApiError(400, 'Invalid request format', error));
        }

        // Handle other errors
        next(new ApiError(500, 'Error updating user', error));
    }
});

module.exports = { editProfile };
