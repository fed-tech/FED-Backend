const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');

//@description     Get all form details based on user access
//@route           GET /api/form/getAllForms
//@access          ADMIN
const getAllForms = async (req, res, next) => {
    try {
        const forms = await prisma.form.findMany({});

        const filteredForms = forms.reduce((acc, form) => {

            // Remove sections from forms where isEventPast is true
            form.sections = !(form.info.isEventPast || form.info.isRegistrationClosed) ? form.sections : null;

            // Add the form to the accumulator
            acc.push(form);
            return acc;
        }, []);

        res.status(200).json({
            success: true,
            message: 'All forms fetched successfully',
            forms: filteredForms,
        });
    } catch (error) {
        console.error('Error while getting forms:', error);
        return next(new ApiError(500, 'Error while getting forms', error));
    }
};

module.exports = { getAllForms };
