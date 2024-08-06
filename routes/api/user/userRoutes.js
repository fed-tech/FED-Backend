const express = require('express');
const router = express.Router();
const { addMember, fetchUser, fetchTeam, deleteMember, deleteUser, editProfile, fetchAccessTypes, fetchAlumni} = require('../../../controllers/userController/userController');
const { verifyToken } = require('../../../middleware/verifyToken');
const { checkAccess } = require('../../../middleware/access/checkAccess');
const { imageUpload } = require('../../../middleware/upload');
const { editProfileImage } = require('../../../controllers/image/editProfileImage');
const { fetchProfileRules } = require('../../../middleware/validator/userValidator');
const { validate } = require('../../../middleware/validationMiddleware');

// Add validation, token verification, and isMemberOrAdmin
router.get("/fetchAccessTypes", fetchAccessTypes)
// User Routes
router.get('/fetchTeam', fetchTeam)
router.get('/fetchAlumni', fetchAlumni)

router.use(verifyToken)

router.post('/fetchProfile',fetchProfileRules(), validate, fetchUser)
router.put('/editDetails', checkAccess('USER','MEMBER'), editProfile)
router.post('/editProfileImage',checkAccess('MEMBER'), imageUpload.single('image'), editProfileImage)


router.use(checkAccess('ADMIN'))
router.post("/addMember", imageUpload.single('image'),addMember)
router.get("/getUser", fetchUser)
router.delete("/deleteMember/:value", deleteMember)
router.delete("/deleteUser", deleteUser)

module.exports = router; 
