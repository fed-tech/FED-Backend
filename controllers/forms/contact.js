// controllers/form/contact.js
const { ApiError } = require('../../utils/error/ApiError');
const { sendMail } = require('../../utils/email/nodeMailer');
const loadTemplate = require('../../utils/email/loadTemplate');
const expressAsyncHandler = require('express-async-handler');

const sendMailTo = "prakashpramanickjsr1717+abc@gmail.com"

//@description     Contact Us
//@route           POST /api/form/contact
//@access          Public
const contact = expressAsyncHandler(async (req, res, next) => {
    try {
        const { email, name, message } = req.body;

        // Validate request body
        if (!email || !name || !message) {
            return next(new ApiError(400, "Missing required fields: email, name, message"));
        }

        // Load the email template
        const template = loadTemplate("contactUs", { name:name, email:email, message:message });

        // Send the email
        await sendMail("prakashpramanickjsr1717+abc@gmail.com", "A response has arrived on Contact Us", template);

        // Send a success response
        res.status(200).json({
            success: true,
            message: 'Contact form submitted successfully',
        });
    } catch (error) {
        console.error('Error in sending contact form:', error);
        return next(new ApiError(500, 'Error in sending contact form', error));
    }
});

module.exports = { contact };
