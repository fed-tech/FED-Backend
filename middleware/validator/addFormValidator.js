const { body } = require('express-validator');

// Updated function to validate minTeamSize and maxTeamSize from the request body
const addFormValidationRules = () => {
  return [
    body('title').notEmpty().withMessage('Title is required').isString(),
    body('description').notEmpty().withMessage('Description is required').isString(),
    body('date').notEmpty().withMessage('Date is required').isISO8601(),
    body('img').notEmpty().withMessage('Image is required').isString(),
    body('amount').notEmpty().withMessage('Amount is required').isString(),
    body('isTeam').notEmpty().withMessage('isTeam is required').isBoolean().toBoolean(),
    body('minTeamSize')
      .notEmpty().withMessage('minTeamSize is required')
      .isInt({ min: 1 }).withMessage('minTeamSize must be an integer greater than 0')
      .toInt(),
    body('maxTeamSize')
      .notEmpty().withMessage('maxTeamSize is required')
      .isInt({ min: 1 }).withMessage('maxTeamSize must be an integer greater than 0')
      .custom((value, { req }) => {
        if (value <= req.body.minTeamSize) {
          throw new Error('maxTeamSize must be greater than minTeamSize');
        }
        return true;
      }).toInt(),
    body('formFields').isObject().withMessage('formFields must be a JSON object'),
    body('maxReg').notEmpty().withMessage('MaxReg is required').isInt({ min: 1 }).toInt(),
    body('eventName').notEmpty().withMessage('EventName is required').isString(),
    body('active').notEmpty().withMessage('Active is required').isBoolean().toBoolean(),
  ];
};

module.exports = {
  addFormValidationRules
};
