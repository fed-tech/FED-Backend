const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');
const deleteImage = require('../../utils/image/deleteImage');

//@description     Delete Form
//@route           DELETE /api/form/deleteForm/:id
//@access          Admins
const deleteForm = async (req, res, next) => {
    console.log("deleteForm");
    try {
        const formId = req.params.id;

        const deletedForm = await prisma.form.delete({
            where: { id: formId },
        });

        // Delete image from cloudinary using promise
        const imageDeletePromise = deletedForm && deletedForm.info && deletedForm.info.eventImg
            ? deleteImage(deletedForm.info.eventImg, 'FormImages')
            : Promise.resolve();

        // Delete all registrations
        if (req.body.deleteRegistrations) {
            await prisma.formRegistration.deleteMany({
                where: { formId: formId }
            });
        }

        // Handle the image deletion promise
        imageDeletePromise
            .then((result) => {
                console.log('Image deleted successfully:', result);
            })
            .catch((error) => {
                console.error('Error in deleting image:', error);
            });
        res.status(200).json({
            success: true,
            message: 'Form deleted successfully',
        });

    } catch (error) {
        console.error('Error in deleting form:', error);
        return next(new ApiError(500, 'Error in deleting form', error));
    }
};

module.exports = { deleteForm };
