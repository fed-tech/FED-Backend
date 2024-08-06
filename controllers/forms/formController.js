// controllers/form/formController.js
const { addForm } = require('./addForm');
const { editForm } = require('./editForm');
const { deleteForm } = require('./deleteForm');
const { getAllForms } = require('./getForm');
const { contact } = require('./contact')

module.exports = {
    addForm,
    editForm,
    deleteForm,
    getAllForms,
    contact
};
