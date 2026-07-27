// controllers/form/deleteForm.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');
const deleteImage = require('../../utils/image/deleteImage');

//@description     Delete Form
//@route           delete /api/form/deleteForm/:id
//@route           DELETE /api/form/deleteForm/:id
//@access          Admins
const deleteForm = async (req, res, next) => {
    console.log("deleteForm: start");
    try {
        const formId = req.params.id;
        console.log("deleteForm: formId", formId);
        console.log("deleteForm: user", {
            id: req.user?.id,
            email: req.user?.email,
            access: req.user?.access,
        });

        if (!formId) {
            return next(new ApiError(400, "Form id is required"));
        }

        const existingForm = await prisma.form.findUnique({
            where: { id: formId },
        });

        if (!existingForm) {
            console.log("deleteForm: form not found", formId);
            return next(new ApiError(404, "Form not found"));
        }

        const [registrationsDeleted, trackersDeleted, deletedForm] = await prisma.$transaction([
            prisma.formRegistration.deleteMany({ where: { formId } }),
            prisma.registrationTracker.deleteMany({ where: { formId } }),
            prisma.form.delete({ where: { id: formId } }),
        ]);

        console.log("deleteForm: registrationsDeleted", registrationsDeleted?.count);
        console.log("deleteForm: trackersDeleted", trackersDeleted?.count);

        // Delete image from cloudinary using promise
        const imageDeletePromise = deletedForm && deletedForm.info && deletedForm.info.eventImg
            ? deleteImage(deletedForm.info.eventImg, 'FormImages')
            : Promise.resolve();

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
