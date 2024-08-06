const { PrismaClient, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const createOrUpdateUser = require('../../../utils/user/createOrUpdateUser');
const deleteImage = require('../../../utils/image/deleteImage');
const uploadImage = require('../../../utils/image/uploadImage');


//@description     Update User Details
//@route           PUT /api/user/addMember
//@access          Admin
const addMember = expressAsyncHandler(async (req, res, next) => {
    console.log("add member controller called ")
    try {
        if (!req.body.email || !req.body.access) {
            return next(new ApiError(400, "Email and access is required"));
        }

        const { email, password, ...rest } = req.body;
        if (rest.access) {
            rest.access = rest.access.toUpperCase().replace(/\s+/g, '_');
            console.log("req.access is ",rest.access);
        }

       if (req.file?.path) {
         if(req.user.img){
             try {
                 deleteImage(req.user.img, 'MemberImages')
             } catch (error) {
                 console.log("Error deleting image", error);
             }
             
         }
         // Upload the new image to cloudinary
        const result = await uploadImage(req.file.path, 'MemberImages')
        console.log("result from cloudinary : ", result)
        if(result){
            rest.img = result.secure_url;
        }
       }
         
        try {
            
            rest.extra = req.body.extra?JSON.parse(req.body.extra):{};
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return next(new ApiError(400, 'Invalid JSON format in request body', error));
        }

        // Update the user details
        const updatedUser = await createOrUpdateUser({ email: email }, rest);

        delete updatedUser.password; // Delete password from updatedUser object

        console.log("Updated user:", updatedUser);

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return next(new ApiError(400, 'Invalid request format', error));
        }
        next(new ApiError(500, 'Error updating user', error)); // Send error with ApiError
    }
});

module.exports = { addMember };
