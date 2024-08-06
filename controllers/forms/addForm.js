const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');
const uploadimage = require('../../utils/image/uploadImage');

// @description     Add regForm 
// @route           POST /api/form/addForm
// @access          Admins
const addForm = async (req, res, next) => {
    try {

        // Handle file upload if applicable
        if (req.file) {
            console.log("uploding file from disk path : ", req.file.path)
            const result = await uploadimage(req.file.path,"FormImages");
            console.log("Result from cloudinary:", result);
            if (result) {
                req.body.info.eventImg = result.secure_url; // Assuming this modifies req.body.info
            }
        }
        else{
            console.log("image not found")
            req.body.info.eventImg = null;
        }

        // Parse JSON strings from req.body.info and req.body.sections
        let info;
        let sections;
        try {
            info = JSON.parse(req.body.info);
            sections = JSON.parse(req.body.sections);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return next(new ApiError(400, 'Invalid JSON format in request body', error));
        }

        // Create new form
        const newForm = await prisma.form.create({
            data: {
                id: req.body.id,
                info: info,
                sections: sections
            },
        });

        res.status(201).json({
            success: true,
            message: 'Form created successfully',
            form: newForm,
        });
    } catch (error) {
        console.error('Error in creating form:', error);

        // Handle specific errors or throw a generic error
        if (error.code === 'P2002') {
            return next(new ApiError(400, 'Duplicate form ID. Form ID must be unique', error));
        }

        // For other unexpected errors
        return next(new ApiError(500, 'Error in creating form', error));
    }
};

module.exports = { addForm };
