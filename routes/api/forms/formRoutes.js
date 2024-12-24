const express = require("express");
const router = express.Router();
const formController = require('../../../controllers/forms/formController')
const registrationController = require('../../../controllers/registration/registrationController');
const { verifyToken } = require('../../../middleware/verifyToken');
const { checkAccess } = require('../../../middleware/access/checkAccess');
const multer = require('multer');
const { imageUpload } = require('../../../middleware/upload');
const upload = multer();
const {renameTeam} = require('../../../controllers/registration/renameTeamController');
const { initiatePayment } = require("../../../controllers/registration/paymentController");

// Add validations
// Define your form routes here

router.get('/getAllForms', formController.getAllForms)
router.post('/contact', formController.contact);

// Initiate payment route
router.post("/initiatePayment", initiatePayment);

router.use(verifyToken);

router.use('/register', 
    checkAccess('USER'), 
    imageUpload.any(), 
    registrationController.addRegistration
);
router.get(
    "/getFormAnalytics/:id",
    formController.analytics
)

// router.get(
//   "/registrationCount",
//   checkAccess("MEMBER"),
//   registrationController.getRegistrationCount
// );

// router.get(
//     "/formAnalytics/:id",
//     formController.analytics
// )

// Add middleware verifyToken, isAdmin
router.use(checkAccess("ADMIN"));

router.post(
    "/addForm",
    imageUpload.fields([
        { name: "eventImg", maxCount: 1 },
        { name: "media", maxCount: 1 },
    ]),
    formController.addForm
);
router.delete("/deleteForm/:id", formController.deleteForm);
router.put(
    "/editForm/:id",
    imageUpload.fields([
        { name: "eventImg", maxCount: 1 },
        { name: "media", maxCount: 1 },
    ]),
    formController.editForm
);

router.get("/download/:id", registrationController.downloadRegistration);

// Team rename route
router.post('/renameTeam', renameTeam);



// Verify payment route
// router.post("/verify", verifyPayment);


module.exports = router;
