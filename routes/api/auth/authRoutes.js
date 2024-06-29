const express = require('express');
const router = express.Router();
const { validate } = require('../../../middleware/validationMiddleware');
const { registerValidationRules, loginValidationRules } = require('../../../middleware/validator/authValidator');
require('dotenv').config();

const passport = require("passport");

// Import the auth controllers required
const { login, verifyEmail, register, forgetPassword, changePassword, logout } = require('../../../controllers/auth/authController');

// Import the middlewares required
const { isUser } = require('../../../middleware/access/userAccess');

router.get("/login/success", (req, res) => {
    if(req.user){
        res.status(200).json({
            error: false,
            message: "Successfully Logged In",
            user: req.user,
        });
    } else{
        res.status(403).json({error: true, message: "Not Authorized"})
    }
});

router.get("/login/failed", (req, res) => {
    res.status(401).json({
        error: true,
        message: "Log in failure",
    });
});

router.get("/google", passport.authenticate('google', {scope:
    ['email', 'profile']
}));

router.get(
    "/google/callback",
    passport.authenticate("google", {
        successRedirect: process.env.CLIENT_URL,
        failureRedirect: "/login/failed",
    })
);

router.get("/logout", (req, res) => {
    req.logout();
    res.redirect(process.env.CLIENT_URL);
});

// Define the authentication routes here

// Routes to login for existing user
router.post('/login', loginValidationRules(), validate, isUser, login);

// Routes to register a new user
router.post('/verifyEmail', verifyEmail)
router.post('/register', registerValidationRules(),validate, register);

// Routes to change password of existing user
router.post('/forgotPassword',isUser, forgetPassword)
router.post('/changePassword',isUser, changePassword)


// router.post('/register', registerValidationRules(), validate, upload.single('image'), register);

// not to be used 
router.post('logout', logout)

module.exports = router;