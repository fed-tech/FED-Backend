// controllers/form/editForm.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/ApiError');

//@description     Edit Forms
//@route           PUT /api/form/editForm/:id
//@access          Admins
const editForm = async (req, res, next) => {
    // if (!errors.isEmpty()) {
    //     return next(new ApiError(400, 'Validation errors', errors.array()));
    // }

    try {
        const formId = req.params.id;
        const { title, description, date, img, amount, isTeam, teamsize, formFields, maxReg, eventName, upi, mail, active } = req.body;

        const existingForm = await prisma.Form.findUnique({
            where: { id: formId },
        });

        if (!existingForm) {
            return next(new ApiError(404, 'Form not found'));
        }

        const updatedForm = await prisma.Form.update({
            where: { id: formId },
            data: {
                title,
                description,
                date,
                img,
                amount,
                isTeam,
                teamsize,
                formFields,
                maxReg,
                eventName,
                upi,
                mail,
                active
            },
        });

        res.status(200).json({
            success: true,
            message: 'Form updated successfully',
            form: updatedForm,
        });
    } catch (error) {
        console.error('Error in updating form:', error);
        return next(new ApiError(500, 'Error in updating form', error));
    }
};

module.exports = {editForm};
