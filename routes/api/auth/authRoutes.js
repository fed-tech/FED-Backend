const express = require('express');
const router = express.Router();
const { validate } = require('../../../middleware/validationMiddleware');
const { registerValidationRules, loginValidationRules } = require('../../../middleware/validator/authValidator');
const passport = require('passport');

// Import the auth controllers required
const { login, verifyEmail, register, forgetPassword, changePassword, logout, googleLogin, googleRegister} = require('../../../controllers/auth/authController');
// const {googleCallback} = require('../../../controllers/auth/google/googleCallback')
const { loginSuccess } = require('../../../controllers/auth/google/loginSuccess')
const { loginFailed } = require('../../../controllers/auth/google/loginFailed')

// Import the middlewares required
const { checkAccess } = require('../../../middleware/access/checkAccess');
const { googleAuth } = require('../../../controllers/auth/google/googleAuthentication');

// Define the authentication routes here
router.get(
    "/google/callback",
    passport.authenticate("google", {
        successRedirect: process.env.CLIENT_URL,
        failureRedirect: "/login/failed",
    })
);
router.get('/login/success', loginSuccess);
router.get('/login/failed', loginFailed);

// google authentication
router.post('/googleAuth', googleAuth);

// Routes to login for existing user
router.post('/login', loginValidationRules(), validate, checkAccess('USER', 'MEMBER'), login);
router.post('/googleLogin', googleLogin);
router.post('/googleRegister', googleRegister);


// Routes to register a new user
router.post('/verifyEmail', verifyEmail)
// router.post('/register', registerValidationRules(), validate, register);
router.post('/register', register);

// Routes to change password of existing user
router.post('/forgotPassword', checkAccess('USER'), forgetPassword)
router.post('/changePassword', checkAccess('USER'), changePassword)


// router.post('/register', registerValidationRules(), validate, upload.single('image'), register);

// To be not used 
router.post('logout', logout)

module.exports = router;