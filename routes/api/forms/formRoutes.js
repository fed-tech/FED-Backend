const express = require("express");
const router = express.Router();
const formController = require("../../../controllers/forms/formController");
const registrationController = require("../../../controllers/registration/registrationController");
const {
  getTeamDetails,
} = require("../../../controllers/registration/getTeamDetails");
const { verifyToken } = require("../../../middleware/verifyToken");
const { checkAccess } = require("../../../middleware/access/checkAccess");
const multer = require("multer");
const { imageUpload } = require("../../../middleware/upload");
const upload = multer();

// Add validations
// Define your form routes here

router.get("/getAllForms", formController.getAllForms);
router.post("/contact", formController.contact);

router.use(verifyToken);

router.get("/teamDetails/:formId", checkAccess("USER"), getTeamDetails);

router.use(
  "/register",
  checkAccess("USER"),
  imageUpload.any(),
  registrationController.addRegistration
);

router.get(
  "/export-attendance/:id",
  checkAccess("ADMIN"),
  registrationController.exportAttendance
);

router.use(
  "/register",
  checkAccess("USER"),
  imageUpload.any(),
  registrationController.addRegistration
);
router.get("/getFormAnalytics/:id", formController.analytics);

router.get(
  "/attendanceCode/:id",
  checkAccess("USER"),
  registrationController.getAttendanceCode
);

router.post(
  "/markAttendance",
  // checkAccess([
  //     "SENIOR_EXECUTIVE_TECHNICAL",
  //     "SENIOR_EXECUTIVE_CREATIVE",
  //     "SENIOR_EXECUTIVE_MARKETING",
  //     "SENIOR_EXECUTIVE_OPERATIONS",
  //     "SENIOR_EXECUTIVE_PR_AND_FINANCE",
  //     "SENIOR_EXECUTIVE_HUMAN_RESOURCE"]),
  registrationController.markAttendance
);

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

module.exports = router;
