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

// [v2] PUBLIC — email action link handler (no auth required)
router.get("/respondJoinRequest", registrationController.respondJoinRequest);

router.use(verifyToken);

router.get("/teamDetails/:formId", checkAccess("USER"), getTeamDetails);

router.use(
  "/register",
  checkAccess("USER"),
  imageUpload.any(),
  registrationController.addRegistration
);

// Team management routes
router.post("/leaveTeam", checkAccess("USER"), registrationController.leaveTeam);
router.post("/inviteTeamMember", checkAccess("USER"), registrationController.inviteTeamMember);
router.get("/inviteLink/:formId", checkAccess("USER"), registrationController.getTeamInviteLink);
router.patch("/renameTeam", checkAccess("USER"), registrationController.renameTeam);
router.post("/removeTeamMember", checkAccess("USER"), registrationController.removeTeamMember);
// [v2] New team management routes
router.post("/createTeam", checkAccess("USER"), registrationController.createTeam);
router.post("/joinTeam", checkAccess("USER"), registrationController.joinTeam);
router.get("/searchTeams/:formId", checkAccess("USER"), registrationController.searchTeams);
router.post("/sendJoinRequest", checkAccess("USER"), registrationController.sendJoinRequest);
router.get("/joinRequestUpdates/:formId", checkAccess("USER"), registrationController.checkJoinRequestUpdates);
router.get("/allJoinRequestUpdates", checkAccess("USER"), registrationController.checkAllJoinRequestUpdates);

router.get(
  "/export-attendance/:id",
  checkAccess("ADMIN"),
  registrationController.exportAttendance
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
