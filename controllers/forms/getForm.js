// controllers/form/getForm.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//@description     Get all form details
//@route           GET /api/form/addForm
//@access          PUBLIC
const getAllForms = async (req, res, next) => {
    try {
        const forms = await prisma.Form.findMany();
        // console.log(forms[0].formFields)
        // delete forms[0].formFields;
        // console.log(forms)
        res.status(200).json({
            success: true,
            message: 'All forms fetched successfully',
            forms,
        });
    } catch (error) {
        console.error('Error while getting forms:', error);
        return next(new ApiError(500, 'Error while getting forms', error));
    }
};

module.exports = {getAllForms};
