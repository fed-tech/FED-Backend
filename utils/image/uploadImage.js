// uploadImage.js
const cloudinary = require('../../config/cloudinary');
const fs = require('fs');
const { ApiError } = require('../error/ApiError');

const uploadImage = async (filePath, folder = 'MemberImages', height = 150, width = 150, crop = 'limit') => {
    try {
        console.log("Uploading file:", filePath);
        const options = {
            folder: folder,
            height: height,
            width: width,
            crop: crop
        };
        console.log("Options are", options);
        const result = await cloudinary.uploader.upload(filePath, options);
        fs.unlinkSync(filePath); // Remove file from server after upload to Cloudinary
        console.log("Image uploaded successfully:", result);
        return result;
    } catch (err) {
        console.error("Error while uploading image:", err);
        throw new ApiError(500, "Error while uploading image", err);
    }
};


module.exports = uploadImage;
