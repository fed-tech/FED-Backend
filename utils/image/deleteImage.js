const cloudinary = require('../../config/cloudinary');
const { ApiError } = require('../error/ApiError');

const deleteImage = async (imageUrl, folder = '') => {
    try {
        if (typeof imageUrl !== 'string' || typeof folder !== 'string') {
            throw new ApiError(400, 'imageUrl and folder must be strings');
        }

        console.log(`Deleting image - ${folder}/${imageUrl}`);

        let imageName = imageUrl.split('/').pop().split('.')[0];
        imageName = folder + "/" + imageName;

        console.log(imageName);
        const result = await cloudinary.uploader.destroy(imageName);

        console.log("Deleted Image", result);
        return result;
    } catch (err) {
        console.error("Error while deleting image:", err);
        throw new ApiError(err.stausCode || 500, err.message || "Error while deleting image", err);
    }
};

module.exports = deleteImage;
