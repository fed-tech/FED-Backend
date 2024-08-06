// middleware/validator/userValidator.js
const { body } = require('express-validator');

const fetchProfileRules = () => [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email'),
    body()
        .custom(value => {
            const allowedFields = ['email'];
            const extraFields = Object.keys(value).filter(key => !allowedFields.includes(key));
            if (extraFields.length > 0) {
                throw new Error(`Extra fields are not allowed: ${extraFields.join(', ')}`);
            }
            return true;
        })
];

module.exports = {
    fetchProfileRules
};
