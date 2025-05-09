const { check, validationResult } = require('express-validator');
const { body } = require('express-validator');

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








exports.productValidationRules = [
  check('productname')
    .trim()
    .notEmpty().withMessage('Product name is required.')
    .isLength({ min: 4 }).withMessage('Product name must be at least 4 characters long.')
    .matches(/^[a-zA-Z]+$/).withMessage('Product name must contain only letters.'),

  check('originalprice')
    .notEmpty().withMessage('Original price is required.')
    .isNumeric().withMessage('Original price must be a number.'),

   check('discount')
    .notEmpty().withMessage('Discount is required.')
    .isNumeric().withMessage('Discount must be a number.'),

   check('quantity')
    .notEmpty().withMessage('Quantity is required.')
    .isNumeric().withMessage('Quantity must be a number.'),

   check('primarymaterial')
    .notEmpty().withMessage('Primary material is required.')
    .isString().withMessage('Primary material must be a string.'),

   check('floorstanding')
    .notEmpty().withMessage('Floor standing field is required.')
    .isString().withMessage('Floor standing must be a string.'),

   check('polishmaterial')
    .notEmpty().withMessage('Polish material is required.')
    .isString().withMessage('Polish material must be a string.'),

   check('material')
    .notEmpty().withMessage('Material is required.')
    .isString().withMessage('Material must be a string.'),

   check('warranty')
    .notEmpty().withMessage('Warranty is required.')
    .isString().withMessage('Warranty must be a string.'),

   check('countryofOrigin')
    .notEmpty().withMessage('Country of origin is required.')
    .isString().withMessage('Country of origin must be a string.'),

   check('weight')
    .notEmpty().withMessage('Weight is required.')
    .isNumeric().withMessage('Weight must be a number.'),

   check('fabric_options')
    .optional()
    .isString().withMessage('Fabric options must be a string if provided.'),

   check('brand')
    .notEmpty().withMessage('Brand is required.')
    .isString().withMessage('Brand must be a string.'),

   check('dimension')
    .notEmpty().withMessage('Dimension is required.')
    .isString().withMessage('Dimension must be a string.'),

  
]




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
      // Check if the category name consists of the same letter
      if (/^(.)\1+$/.test(value.toLowerCase())) {
        throw new Error('Category name must not consist of the same letter repeated');
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

exports.validateCoupon =[
   
    check('code')
        .notEmpty().withMessage('Coupon code is required')
        .isLength({ min: 5, max: 20 }).withMessage('Coupon code must be between 5 and 20 characters')
        .isAlphanumeric().withMessage('Coupon code can only contain letters and numbers'),

   
    check('discountType')
        .notEmpty().withMessage('Discount type is required')
        .isIn(['percentage', 'fixed']).withMessage('Discount type must be either "Percentage" or "Fixed Amount"'),

    
    check('discountValue')
        .notEmpty().withMessage('Discount value is required')
        .isFloat({ gt: 0 }).withMessage('Discount value must be a positive number')
        .custom((value, { req }) => {
            if (req.body.discountType === 'percentage' && (value <= 0 || value > 100)) {
                throw new Error('Percentage discount must be between 1 and 100');
            }
            return true;
        }),

    
    check('maxDiscount')
        .optional()
        .isFloat({ gt: 0 }).withMessage('Max discount must be a positive number')
        .custom((value, { req }) => {
            if (req.body.discountType === 'percentage' && !value) {
                throw new Error('Max discount is required when discount type is percentage');
            }
            return true;
        }),

    
    check('minPurchaseAmount')
        .optional()
        .isFloat({ gt: 0 }).withMessage('Minimum purchase amount must be a positive number'),

    
    check('usageLimit')
        .notEmpty().withMessage('Usage limit is required')
        .isInt({ gt: 0 }).withMessage('Usage limit must be a positive integer'),

    
    check('validFrom')
        .notEmpty().withMessage('Valid from date is required')
        .isISO8601().withMessage('Valid from must be a valid date')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Valid from date cannot be in the past');
            }
            return true;
        }),

   
    check('validUntil')
        .notEmpty().withMessage('Valid until date is required')
        .isISO8601().withMessage('Valid until must be a valid date')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.validFrom)) {
                throw new Error('Valid until date must be after the valid from date');
            }
            return true;
        }),
];

exports.changePassword = [

    check('newPassword')
    .notEmpty().withMessage('New password is required') 
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
      .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('New password must contain at least one number')
      .matches(/[@$!%*?&]/).withMessage('New password must contain at least one special character'),
    
    check('confirmPassword')
    .notEmpty().withMessage('New password is required') 
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Confirm password must match new password');
        }
        return true;
      }),
  
]