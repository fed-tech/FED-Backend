// controllers/form/addForm.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/ApiError');

//@description     Add forms 
//@route           POST /api/form/addForm
//@access          Admins
const addForm = async (req, res, next) => {

    try {
        const { title, description, date, img, amount, isTeam, teamsize, formFields, maxReg, eventName, upi, mail } = req.body;

        const newForm = await prisma.Form.create({
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
                mail
            },
        });

        res.status(201).json({
            success: true,
            message: 'Form created successfully',
            form: newForm,
        });
    } catch (error) {
        console.error('Error in creating form:', error);
        return next(new ApiError(500, 'Error in creating form', error));
    }
};

module.exports = { addForm };
