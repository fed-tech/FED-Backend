const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendMail } = require("../../utils/email/nodeMailer");
const loadTemplate = require("../../utils/email/loadTemplate");
const generateOtp = require("../otp/generateOTP");
const { ApiError } = require("../../utils/error/ApiError");

const sendOtpToMail = async (email, purpose, templateName, subject, allowRetry = true, placeholders = {}, validity = 15) => {
    if (!email || !purpose || !templateName || !subject) {
        throw new ApiError(400, "Email, purpose, templateName, and subject are required");
    }

    console.log(email, purpose, templateName, subject, allowRetry, placeholders, validity);

    try {
        let existingOtp = await prisma.otp.findFirst({
            where: { email: email, for: purpose },
        });

        console.log("Existing otp : ", existingOtp);

        if (existingOtp && !existingOtp.allowRetry) {
            console.log("Retry is not allowed");
            throw new ApiError(400, "OTP already exists! Retry after some time");
        }

        const generatedOTP = generateOtp(4,false,false,false);

        // Upsert logic based on allowRetry flag
        const dbEntry = await prisma.otp.upsert({
            where: {
                email_for: {
                    email: email,
                    for: purpose,
                },
            },
            update: {
                otp: generatedOTP,
                age: validity,
                allowRetry,
            },
            create: {
                email: email,
                otp: generatedOTP,
                age: validity,
                for: purpose,
                allowRetry: allowRetry,
                template: templateName,
                subject: subject,
            },
            select: {
                id: true,
            },
        });

        console.log("DBEntry ", dbEntry);

        const templateContent = loadTemplate(templateName, { otp: generatedOTP, validity: validity, ...placeholders });
        await sendMail(email, subject, templateContent);

        // Set auto-delete for the OTP after validity ends
        setTimeout(async () => {
            try {
                await prisma.otp.delete({
                    where: { id: dbEntry.id },
                });
            } catch (error) {
                console.error('Error deleting OTP:', error);
            }
        }, 60000 * validity);

        return { message: `OTP sent successfully to ${email}. Valid for ${validity} mins`, id: dbEntry.id, status: 201 };
    } catch (error) {
        console.error("Error in sendOtpToMail function", error);
        if (error instanceof ApiError) {
            // Rethrow known ApiError
            throw error;
        } else {
            // Handle unexpected errors
            throw new ApiError(500, "Internal Server Error", error);
        }
    }
};

module.exports = sendOtpToMail;
