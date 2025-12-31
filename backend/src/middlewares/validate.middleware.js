/**
 * Middleware de Validation
 * @description Vérifie les erreurs de express-validator
 */

const { validationResult } = require('express-validator');

/**
 * Middleware qui vérifie les erreurs de validation
 * À utiliser après les validators
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errorMessages
    });
  }

  next();
};

module.exports = validate;
