const express = require('express');
const router = express.Router();
const { addForm, editForm, deleteForm, getAllForms } = require('../../controllers/forms/formController');
const { verifyToken } = require('../../middleware/verifyToken');
const { isAdmin } = require('../../middleware/isAdmin');
const { addFormValidationRules } = require('../../middleware/validator/addFormValidator'); // Ensure this path is correct
const { validate } = require('../../middleware/validationMiddleware');

/**
 * @description Get all forms
 * @route       GET /api/forms/getAllForms
 * @access      Public
 */
router.get('/getAllForms', getAllForms);

// Apply verifyToken and isAdmin middleware globally to all routes in this router
router.use(verifyToken, isAdmin);

/**
 * @description Add a new form
 * @route       POST /api/forms/addForm
 * @access      Admin
 * @middleware  addFormValidationRules
 */
router.post('/addForm', addFormValidationRules(), validate, addForm);

/**
 * @description Delete a form
 * @route       DELETE /api/forms/deleteForm/:id
 * @access      Admin
 */
router.delete('/deleteForm/:id', deleteForm);

/**
 * @description Edit a form
 * @route       PUT /api/forms/editForm/:id
 * @access      Admin
 */
router.put('/editForm/:id', editForm);

module.exports = router;
