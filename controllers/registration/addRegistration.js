const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');

// @description     Add registration for a form
// @route           POST /api/form/register
// @access          Public (or as per your authentication requirements)
const addRegistration = async (req, res, next) => {
    try {
        const { formId, value } = req.body;

        if (!formId || !value) {
            return next(new ApiError(400, "Form ID and form data are required"));
        }

        // Check if the form exists
        const formExists = await prisma.form.findUnique({
            where: { id: formId }
        });

        if (!formExists) {
            return next(new ApiError(404, 'Form not found'));
        }

        // const regUserEmails = getUniqueEmails(formData);
        // console.log(regUserEmails);

        const registrationExists = await prisma.formRegistration.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    // {
                    //     regUserEmails: {
                    //         hasSome: regUserEmails
                    //     }
                    // }
                ],
                AND: {
                    formId: formId
                }
            }
        });

        if (registrationExists) {
            return next(new ApiError(400, 'User is already registered in this event'));
        }

        const newRegistration = await prisma.formRegistration.create({
            data: {
                user: { connect: { id: req.user.id } },
                form: { connect: { id: formId } },
                value: value,
                // regUserEmails: regUserEmails
            }
        });

        // Upsert users based on email
        // for (const email of regUserEmails) {
        //     await prisma.user.upsert({
        //         where: { email },
        //         update: {
        //             regForm: {
        //                 push: formId
        //             }
        //         },
        //         create: {
        //             email,
        //             regForm: [formId],
        //             // Add other default fields for new user creation here
        //             name: '', // Provide a default name if needed
        //             password: '', // Provide a default password if needed
        //             // Other necessary fields
        //         }
        //     });
        // }

        res.status(201).json({
            success: true,
            message: 'Registration added successfully',
            data: newRegistration,
        });
    } catch (error) {
        console.error('Error in adding registration:', error);
        return next(new ApiError(500, 'Error in adding registration', error));
    }
};

function getUniqueEmails(data) {
    // const emails = new Set();
    // data.forEach(section => {
    //     if (section.email) {
    //         emails.add(section.email);
    //     }
    // });
    // return Array.from(emails);
}

module.exports = { addRegistration };
