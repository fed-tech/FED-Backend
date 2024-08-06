const { register } = require('./registerController');
const { login } = require('./loginController');
const { logout } = require('./logoutController');
const { forgetPassword } = require('./forgetPassword');
const { changePassword } = require('./changePassword');
const { verifyEmail } = require('./verifyEmailController');
const { googleLogin } = require('./google/googleLogin');
const { googleRegister } = require('./google/googleRegister');

module.exports = {
    register,
    login,
    logout,
    forgetPassword,
    changePassword,
    verifyEmail,
    googleLogin,
    googleRegister
};
