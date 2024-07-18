const { check, validationResult } = require('express-validator');
const { isLength } = require('validator');
 const  productValidators = [
    check('productname').notEmpty().withMessage('Product name is required'),
    check("price").notEmpty().withMessage("Price is required").isFloat({min:0}).withMessage("Price must be greater than or equal to 0"),
    check('quantity').notEmpty().withMessage('Quantity is required').isInt({min:0}).withMessage("Quantity must be greater than or equal to 0"),
    check("primarymaterial").notEmpty().withMessage("Primary material is required"),
    check("polishmaterial").notEmpty().withMessage("Polish material is required"),
    check("floorstanding").notEmpty().withMessage("Floor standing is required"),
    check("color").notEmpty().withMessage("Color is required"),
    check("material").notEmpty().withMessage("Material is required"),
    check("warranty").notEmpty().withMessage("Warranty is required"),
    check("dimension").notEmpty().withMessage("Dimension is required"),
    check("fabric_options").notEmpty().withMessage("Fabric options is required"),
    check("brand").notEmpty().withMessage("Brand is required"),
    check("countryofOrigin").notEmpty().withMessage("Country of origin is required"),
    check("weight").notEmpty().withMessage("Weight is required").isFloat({min:0}).withMessage("Weight must be greater than or equal to 0"),
    check("description").notEmpty().withMessage("Description is required"),
    check('images').custom((value, { req }) => {
      if (!req.files || req.files.length === 0) {
        throw new Error('Needed Atleast One Image with [.png, .jpg, .webp, .jpeg] Format');
      }
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      for (const file of req.files) {
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          throw new Error('Invalid image format. Allowed formats are [.png, .jpg, .webp, .jpeg]');
        }
      }
      return true;
    })
 ]

const handleError = (err) => {
    console.log(err.message, err.code);
  
    let errors = {
      email: "",
      password: "",
    };
  
    if (err.message === "incorrect email") {
      errors.email = "Email is not registered";
    }
  
    if (err.message === "incorrect password") {
      errors.password = "Incorrect password or email";
    }
  
    if (err.message === "empty fields") {
      errors.email = "Email is required";
      errors.password = "Password is required";
    }
  
    return errors;
  };
  

// otp validator
const validateOtp = [
  check('otp')
    .notEmpty().withMessage('OTP is required')
    .bail()
    .isNumeric().withMessage('OTP must be a number')
    .bail()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('user/otp_submit', { errors: errors.array() });
  }
  next();
};

//signupValidator.js


const signupValidationRules = [
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
    .isMobilePhone().withMessage('Phone number is not valid'),
    // isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits long'),
];

const validateSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('user/user_signup', { errors: errors.mapped() });
  }
  next();
};



  module.exports = {
     handleError ,
    productValidators,
    validateOtp,
    validate,
    signupValidationRules,
    validateSignup,
  };
  

