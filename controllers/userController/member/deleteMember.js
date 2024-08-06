const { PrismaClient, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const updateUser = require('../../../utils/user/updateUser');

//@description     Delete Member Field
//@route           DELETE /api/user/deleteMember/:value
//@access          Admin
const deleteMember = expressAsyncHandler(async (req, res, next) => {
    try {
        // Check if value is provided
        const { value } = req.params; // Assuming value is a URL parameter
        console.log("value is ", value)
        if (!value || value === 'undefined') {
            console.log("Missing params (id or email)")
            return next(new ApiError(400, 'Missing params (id or email)'));
        }

        // Check if the user exists
        const existingUser = await prisma.user.findUnique({
            where: {
                id: value
            }
        });

        if (!existingUser) {
            return next(new ApiError(404, 'User not found'));
        }

        // Update the user to set the access field to USER
        const updatedUser = await updateUser({ id: existingUser.id }, { access: AccessTypes.USER });

        // Delete the password before sending the data
        delete updatedUser.password;

        res.status(200).json({ success: true, message: "Member changed to user type", user: updatedUser });
    } catch (error) {
        console.error('Error deleting member', error);
        next(new ApiError(500, 'Error deleting member field', error));
    }
});

module.exports = { deleteMember };
