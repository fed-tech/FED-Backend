const express = require('express');
const router = express.Router();
const formController = require('../../../controllers/forms/formController')
const registrationController = require('../../../controllers/registration/registrationController');
const {verifyToken} = require('../../../middleware/verifyToken');
const { checkAccess } = require('../../../middleware/access/checkAccess');
const multer = require('multer');
const { imageUpload } = require('../../../middleware/upload');
const upload = multer();

// Add validations
// Define your form routes here

router.get('/getAllForms',formController.getAllForms)
router.post('/contact',formController.contact);


router.use(verifyToken)

router.use('/register', checkAccess('USER'), registrationController.addRegistration)


router.get('/registrationCount', checkAccess('MEMBER'), registrationController.getRegistrationCount)

// Add middleware verifyToken, isAdmin
router.use(checkAccess('ADMIN'))

router.post('/addForm', imageUpload.single('image'), formController.addForm )
router.delete('/deleteForm/:id', formController.deleteForm)
router.put('/editForm', formController.editForm)

router.get('/download/:id', registrationController.downloadRegistration)

module.exports = router; 
