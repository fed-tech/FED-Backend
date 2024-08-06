const { PrismaClient, OtpPurpose } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../utils/error/ApiError');
const verifyOtp = require('../../utils/otp/verifyOtp');
const updateUser = require('../../utils/user/updateUser');

//@description     Changing Password
//@route           POST /api/user/changePassword
//@access          Public
const changePassword = expressAsyncHandler(async (req, res, next) => {
    try {
        console.log(`${req.body.email} is trying to change the password !`);
        
        const { newPassword, confirmPassword, otp, email } = req.body;

        // Apply validators and remove from here
        if(!newPassword || !confirmPassword || !otp || !email){
            next(new ApiError(400, "Missing fields."))
        }
        // Check if both the password matches
        if (newPassword !== confirmPassword) {
            next(new ApiError(409,"Conflict : New Password and confirm Password did not match!!"))
        }

        //verify OTP -> Assuming that unique user constaint is handeleted in verifyEmailController
        const isValidOTP = await verifyOtp( email, otp, OtpPurpose.FORGOT_PASSWORD, false)
        // console.log("passing step2");
        // console.log("is valid otp", isValidOTP);
        // console.log("passing step 3");

        if (!isValidOTP.id) {
            console.log("invalid otp");
            return next(new ApiError(isValidOTP.status,"Invalid OTP"))
        }
        const samePass = await bcrypt.compare(newPassword, req.user.password);
        console.log(samePass);

        if(samePass){
            return next(new ApiError(400,"New password cannot be same as the old password ! Instead try login"));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user = await updateUser({email : email},{password : hashedPassword})
        console.log("step 4");
        if(!user){
           return next( new ApiError(400, "error creating user"))
        }
        res.status(200).json({ status:"OK", message: "Password has been changed successfully !!" });
        console.log("Password changed successfully");

        // Delete the OTP in the background using a Promise
        new Promise((resolve, reject) => {
            prisma.otp.delete({
                where: {id : isValidOTP.id }
            }).then(() => {
                resolve();
            }).catch(error => {
                console.error('Error deleting OTP:', error);
                reject(error);
            });
        });

    } catch (error) {
        next(new ApiError(500, "Error while changing password", error));
    }
});

module.exports = { changePassword };
