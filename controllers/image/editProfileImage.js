const upload = require('../../middleware/upload');
const expressAsyncHandler = require('express-async-handler');
const {ApiError} = require('../../utils/error/ApiError');
const uploadimage = require('../../utils/image/uploadImage')

const deleteImage = require('../../utils/image/deleteImage');
const updateUser = require('../../utils/user/updateUser');

//@description     Edit Member Image
//@route           POST /api/user/editProfileImage
//@access          Members
const editProfileImage = expressAsyncHandler(async (req, res, next) => {
    if (!req.file) {
        console.log("req.file was not found, file could not be uploaded")
        return next(new ApiError(400, "No file uploaded"));
    }

    try {
        console.log("user is ", req.user)

        console.log("Existing image : ", req.user.img)

        console.log("uploading file -", req.file.path)

        //delete the existing image
        if(req.user.img){
            try {
                deleteImage(req.user.img, 'MemberImages')
            } catch (error) {
                console.log("Error deleting image", error);
            }
            
        }
        // Upload the new image to cloudinary
        const result = await uploadimage(req.file.path, 'MemberImages')
        console.log("result from cloudinary : ", result)

        res.status(200).json({
            success: true,
            url: result.secure_url,
            message: "Image uploaded successfully"
        });
        const user = updateUser({email : req.user.email},{img : result.secure_url})
    } catch (err) {
        return next(new ApiError(500, "Error while uploading image", err))
    }
});

module.exports = { editProfileImage };
