// controllers/form/deleteForm.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/ApiError');

//@description     Delete Form
//@route           delete /api/form/deleteForm/:id
//@access          Admins
const deleteForm = async (req, res, next) => {
    try {
        const formId = req.params.id;

        await prisma.Form.delete({
            where: { id: formId },
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
