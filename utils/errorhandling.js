const { check, validationResult } = require('express-validator');
const { isLength } = require('validator');
// exports.productValidators = [
//   check('productname').notEmpty().withMessage('Product name is required'),
//   check('description').isArray({ min: 1 }).withMessage('Description must be an array with at least one item'),
//   check('originalprice').isFloat({ gt: 0 }).withMessage('Original price must be a positive number'),
//   check('discount').isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
//   check('category').notEmpty().withMessage('Category is required'),
//   check('weight').isFloat({ gt: 0 }).withMessage('Weight must be a positive number'),
//   check('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
//   check('brand').notEmpty().withMessage('Brand is required'),
//   check('primarymaterial').notEmpty().withMessage('Primary material is required'),
//   check('floorstanding').isBoolean().withMessage('Floor standing must be true or false'),
//   check('polishmaterial').notEmpty().withMessage('Polish material is required'),
//   check('color').isArray({ min: 1 }).withMessage('Color must be an array with at least one item'),
//   check('material').notEmpty().withMessage('Material is required'),
//   check('countryofOrigin').notEmpty().withMessage('Country of origin is required'),
//   check('warranty').notEmpty().withMessage('Warranty is required'),
//   check('dimension').notEmpty().withMessage('Dimension is required'),
//   check('fabric_options').optional().isArray().withMessage('Fabric options must be an array'),
//   check('images').custom((value, { req }) => {
//     if (!req.files || req.files.length === 0) {
//       throw new Error('At least one image must be uploaded');
//     }
//     return true;
//   }),
// ];



// otp validator
exports.validateOtp = [
  check('otp')
    .notEmpty().withMessage('OTP is required')
    .bail()
    .isNumeric().withMessage('OTP must be a number')
    .bail()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long'),
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.mapped() });
  }
  next();
};
//signupValidator.js


exports.signupValidationRules = [
  check('fname')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),

  check('lname')
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),

  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email is not valid'),


  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  check('phone')
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Phone number is not valid')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits long'),
];



exports.validateLoginRules = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 6 characters long'),

];

exports.validateMyAccount = [
  check('fname')
    .notEmpty().withMessage('First name is required'),
  check('lname')
    .notEmpty().withMessage('Last name is required'),
  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email is not valid'),
  check('phone')
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Phone number is not valid')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits long'),
];


exports.validateChangePass = [
  check("currentpassword")
    .notEmpty().withMessage('Current password is required'),

  check("newpassword")
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .isLength({ max: 20 }).withMessage('Password must be no more than 20 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character'),

  check("confirmpassword")
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .isLength({ max: 20 }).withMessage('Password must be no more than 20 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character'),

];

//admin login validator
exports.adminLoginRules = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  check('password')
    .notEmpty()
    .withMessage('Password is required')

];


//add product validator


exports.validateProduct = [
  check('productName')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isAlphanumeric('en-US', { ignore: ' ' }).withMessage('Product name should not contain symbols'),

  check('originalprice')
    .notEmpty().withMessage('Original price is required')
    .isFloat({ min: 0 }).withMessage('Original price should not be negative'),

  check('discount')
    .notEmpty().withMessage('Discount is required')
    .isFloat({ min: 0 }).withMessage('Discount should not be negative'),

  check('inStock')
    .notEmpty().withMessage('In stock is required'),

  check('weight')
    .notEmpty().withMessage('Weight is required')
    .isFloat({ min: 0 }).withMessage('Weight should not be negative'),

  check('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Category should be a valid ID'),

  check('description')
    .isArray({ min: 1 }).withMessage('Include at least one description'),

  check('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 0 }).withMessage('Quantity should not be negative'),

  check('brand')
    .trim()
    .notEmpty().withMessage('Brand is required'),

  check('primarymaterial')
    .trim()
    .notEmpty().withMessage('Primary material is required'),

  check('floorstanding')
    .trim()
    .notEmpty().withMessage('Floor standing is required'),

  check('polishmaterial')
    .trim()
    .notEmpty().withMessage('Polish material is required'),

  check('color')
    .isArray({ min: 1 }).withMessage('Include at least one color'),

  check('images')
    .isArray({ min: 3 }).withMessage('Include at least 3 images'),

  check('material')
    .trim()
    .notEmpty().withMessage('Material is required'),

  check('warranty')
    .trim()
    .notEmpty().withMessage('Warranty is required'),

  check('countryofOrigin')
    .trim()
    .notEmpty().withMessage('Country of origin is required'),

  check('fabric_options')
    .trim()
    .notEmpty().withMessage('Fabric options are required'),

  check('dimension')
    .trim()
    .notEmpty().withMessage('Dimension is required'),
];



exports.validateCategory = [
  check('categoryName')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .custom(value => {
      if (!isNaN(value)) {
        throw new Error('Category name must not be a number');
      }
      if (/[^a-zA-Z0-9 ]/.test(value)) {
        throw new Error('Category name should not contain symbols');
      }
      return true;
    }),
];


exports.validateAddress = [
  

  check('firstName')
    .notEmpty().withMessage('First name is required'),

  check('lastName')
    .notEmpty().withMessage('Last name is required'),

  check('address')
    .notEmpty().withMessage('Home address is required'),

  check('landmark')
    .optional(),

  check('city')
    .notEmpty().withMessage('City is required'),

  check('street')
    .notEmpty().withMessage('Street is required'),

  check('state')
    .notEmpty().withMessage('State is required'),

  check('pincode')
    .notEmpty().withMessage('Pincode is required')
    .isLength({ min: 6, max: 6 }).withMessage('Pincode must be exactly 6 digits'),

  check('phone')
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 digits'),
];
