// uploadImage.js
const cloudinary = require('../../config/cloudinary');
const fs = require('fs');
const ApiError = require('../../utils/error/ApiError');

const uploadImage = async (filePath, folder = 'MemberImages', height=150, width=150, crop) => {
    try {
        console.log("Uploading file:", filePath);
        const result = await cloudinary.uploader.upload(
            filePath,
            { 
                folder: folder,
                height : height,
                width : width,
                crop : crop
            },
            (error, result) => {
                console.log(result, error);
            }

        );
        // Remove file from server after upload to Cloudinary
        fs.unlinkSync(filePath);

        console.log("Image uploaded successfully:", result);
        return result;
    } catch (err) {
        console.error("Error while uploading image:", err);
        throw new ApiError(500, "Error while uploading image", err);
    }
};

module.exports = uploadImage;
