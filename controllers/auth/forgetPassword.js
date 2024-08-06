const { PrismaClient, OtpPurpose } = require("@prisma/client");
const prisma = new PrismaClient();
const expressAsyncHandler = require("express-async-handler");
const { ApiError } = require("../../utils/error/ApiError");
const generateOtp = require("../../utils/otp/generateOTP");
const sendOtpToMail = require("../../utils/email/generateOtpAndSendMail");
const verifyOTP = require("../../utils/otp/verifyOtp");

// SET OTP validity in minutes
const validity = 15;

//@description     Forgot Password
//@route           POST /api/user/forgetPassword
//@access          Existing Users
const forgetPassword = expressAsyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new ApiError(400, "Email is required"));
    }


    // Only existing users can apply for Forget Password
    const existingUser = await prisma.user.findUnique({
        where: { email: email },
    });

    if (!existingUser) {
        return next(new ApiError(400, "User not found!"));
    }

    try {

        // Send OTP to user
        const template = 'forgotPassword'
        const subject = 'OTP for setting new password'
        const placeholders = { validity : validity };
        sendOtpToMail(email, OtpPurpose.FORGOT_PASSWORD ,template, subject, true, placeholders);

        res.json({ message: `OTP sent successfully to ${email}. Valid for ${validity} mins` });
        console.log("Cahnge the logic in forgotPassword Controller to delete the otp");

        // Set auto-delete for the OTP after validity ends
        setTimeout(async () => {
            try {
                const deletedOTP = await pirisma.otp.delete({
                    where: { email: email },
                });
                if (process.env.DEBUG === "true") {
                    console.log(`OTP Deleted for ${ email } : ${ deletedOTP }`);
                }
            } catch (error) {
                console.error('Error deleting expired OTP:', error);
            }
        }, 60000 * validity);

    } catch (error) {
        console.error('Error in forgot password process:', error);
        next(new ApiError(500, "Error in forgot password process"));
    }
});

module.exports = { forgetPassword };
