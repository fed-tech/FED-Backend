const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');
const uploadimage = require('../../utils/image/uploadImage');
const deleteImage = require('../../utils/image/deleteImage'); // Assuming a deleteImage function for deleting images

// @description     Edit form sections and info
// @route           PUT /api/form/editForm/:id
// @access          Admins
const editForm = async (req, res, next) => {
    const formId = req.params.id;
    const { info, sections, sectionsToDelete } = req.body;

    try {
        // Fetch current form data
        const currentForm = await prisma.form.findUnique({
            where: { id: formId },
        });

        if (!currentForm) {
            return next(new ApiError(404, 'Form not found'));
        }

        // Handle image upload if present in the request
        if (req.file) {
            // Delete the existing image
            if (currentForm.info.eventImg) {
                await deleteImage(currentForm.info.eventImg);
            }
            // Upload new image
            const result = await uploadimage(req.file.path);
            if (result) {
                info.eventImg = result.secure_url;
            }
        }

        // Update info if provided 
        const updatedInfo = info ? { ...currentForm.info, ...info } : currentForm.info;

        // Update sections 
        let finalUpdatedSections = [...currentForm.sections];

        if (sections) {
            sections.forEach(updatedSection => {
                const index = finalUpdatedSections.findIndex(sec => sec.id === updatedSection.id);
                if (index !== -1) {
                    // Update existing section
                    finalUpdatedSections[index] = updatedSection;
                } else {
                    // Add new section if not found
                    finalUpdatedSections.push(updatedSection);
                }
            });
        }

        // Remove sections marked for deletion
        if (sectionsToDelete && sectionsToDelete.length > 0) {
            finalUpdatedSections = finalUpdatedSections.filter(sec =>
                !sectionsToDelete.includes(sec.id)
            );
        }

        // Perform the update operation
        const updatedForm = await prisma.form.update({
            where: { id: formId },
            data: {
                info: updatedInfo,
                sections: { set: finalUpdatedSections },
            },
        });

        res.json({
            success: true,
            message: 'Form info and sections updated successfully',
            form: updatedForm,
        });
    } catch (error) {
        console.error('Error updating form info and sections:', error);
        return next(new ApiError(500, 'Error updating form info and sections', error));
    }
};

module.exports = { editForm };
