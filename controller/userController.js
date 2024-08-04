const Userdb = require("../models/UserModels");
const Otpdb = require("../models/otpModel")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtp, resendOtp } = require("../utils/helpers");
const Productdb = require("../models/productModels")
const Orderdb = require("../models/orderModel")
const Categroydb = require("../models/categoryModel")
const CountryList = require("country-list")
const countries = CountryList.getNames()
const uuidv4 = require("uuid").v4;
const Cartdb = require("../models/cartModel");
const { ObjectId, ReturnDocument, TopologyDescriptionChangedEvent } = require("mongodb");
const Addressdb = require("../models/addressModel");
const { assign } = require("nodemailer/lib/shared");
const { configDotenv } = require("dotenv");
const {productDetails,cartDetails, orderDetails} = require("../utils/helpers");
const { clearCache } = require("ejs");

//getting user signup
exports.getUserSignup = (req, res, next) => {
  res.status(200).render("user/user_signup", {
    errors: null,
    userSignUp: true,

  });
};

exports.userRegistration = async (req, res, next) => {
  const data = {
    firstName: req.body.fname,
    lastName: req.body.lname,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    phone: req.body.phone,
  };

  try {
    const existuser = await Userdb.userCollection.findOne({ email: data.email });
    if (existuser) {
      return res.status(400).json({
        errors: { email: { msg: "User Already Exist" } },
        userSignUp: true
      });
    } else {
      req.session.userdata = data;
      sendOtp(req.body.email, req.body.email)
        .then((msg) => {
          res.status(200).json({ success: true });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            customError: 'Failed to send OTP. Please try again later.',
            userSignUp: true

          });
        });
    }
  } catch (err) {
    next(err);
  }
};

//getting user otp
exports.getsubmitSignupotp = async (req, res, next) => {
  console.log("Inserting data:", req.session.userdata);
  res.status(200).render("user/otp_submit", {
    userOtpSubmit: true
  }
  );
};

exports.submitSignupotp = async (req, res, next) => {
  try {
    if (!req.session.userdata || !req.session.userdata.email) {
      return res.status(400).json({
        errors: { email: { msg: "Email is required" } },
        userOtpSubmit: true
      });
    }
    const isOtp = await Otpdb.otpCollection.findOne({
      otpId: req.session.userdata.email,
    });

    const time = Date.now();
    if (!isOtp) {
      return res.status(400).json({
        errors: { otp: { msg: "OTP record not found" } },
        userOtpSubmit: true
      });
    }

    console.log('OTP from request:', req.body.otp);
    console.log('OTP in DB:', isOtp.otp);
    console.log('OTP expiry time:', isOtp.expireAt);

    if (parseInt(req.body.otp) === isOtp.otp) {
      if (isOtp.expireAt >= time) {
        const userInserted = await Userdb.userCollection.insertMany(req.session.userdata);

        if (userInserted) {
          const token = jwt.sign({ _id: userInserted._id }, process.env.JWT_SECRET);
          res.cookie("token", token, { httpOnly: true });
          return res.status(200).json({
            success: "success",
            redirect: "/" // Redirect to home page
          });
        }
      } else {
        return res.status(400).json({
          errors: { otp: { msg: "OTP Expired" } },
          userOtpSubmit: true
        });
      }
    } else {
      return res.status(400).json({
        errors: { otp: { msg: "Invalid OTP" } },
        userOtpSubmit: true
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};


//resend signup otp
exports.resendSignUpOtp = async (req, res, next) => {
  try {
    console.log("Session userdata:", req.session.userdata);
    console.log("User email:", req.session.userdata?.email);

    if (!req.session.userdata || !req.session.userdata.email) {
      return res.status(400).json({
        customError: 'Email not found in session', success: false
      });
    }

    const data = await resendOtp(req.session.userdata.email, req.session.userdata.email);
    console.log("OTP resent to email:", req.session.userdata.email);
    console.log(data);
    if (data.success === undefined) {
      data.success = true;

    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in resendSignUpOtp:", error);
    res.status(500).json({
      customError: 'Failed to resend OTP. Please try again later.',
      success: false
    });
  }
};



//get user Login
exports.getUserLogin = (req, res, next) => {
  try {
    if (req.cookies.token) {
      const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      if (user) {
        return res.redirect("/");
      }
    } else {
      req.session.destroy();
      return res.status(200).render("user/login", {
        errors: null,
        userLogin: true
      });
    }
  } catch (err) {
   console.log(err);
    next(err);
  }
};



// user signin
exports.userSignin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const existUser = await Userdb.userCollection.findOne({ email }).lean();
    if (!existUser) {
      return res.status(400).json({
        errors: { email: { msg: "User not found" } },
        userLogin: true
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, existUser.password);
    if (!isMatch) {
      return res.status(400).json({
        errors: { email: { msg: "Incorrect email or password" } },
        userLogin: true
      });
    }

    // Check if user is blocked
    if (existUser.isBlocked) {
      return res.status(400).json({
        errors: { email: { msg: "User is blocked" } },
        userLogin: true
      });
    }

    // Generate JWT
    const token = jwt.sign({ _id: existUser._id }, process.env.JWT_SECRET);

    // Set cookie and respond
    res.cookie("token", token, {
      httpOnly: true,
      sameSite:"Strict",
    });

    res.json({
      message: ' Login successful',
      success: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      customError: "Internal server error",
      userLogin: true
    });
  }
};


// getting forgot password email submit
exports.enterForgotEmail = async (req, res, next) => {
  res.status(200).render("user/forgot_password",

  );
};
// submitting forgot password email
exports.submitEmailForOtp = async (req, res, next) => {
  console.log("This is from submitEmail: " + req.body.Email);
  const { Email } = req.body;


  if (!Email) {
    return res.status(400).json({ errors: { email: { msg: "Email is required" } } });
  }
  try {


    const userExist = await Userdb.userCollection.findOne({ email: req.body.Email }).lean();
    if (!userExist) {
      return res.status(400).json({ errors: { email: { msg: "User not found" } } });
    } else {
      try {
        await sendOtp(req.body.Email, userExist._id);

        req.session.forgotUser = userExist._id;
        req.session.forgotUserEmail = req.body.Email;
        console.log("this is from req.body" + req.session.forgotUserEmail);
        console.log("this is the id of the user" + req.session.forgotUser);

        return res.json({
          message: "OTP sent. Redirecting to OTP page.", redirectUrl: "/user/forgot_otp",
          success: true,
        });
      } catch (otpError) {
        console.log('Error sending OTP:', otpError);
        return res.status(500).json({ errors: { customError: "Failed to send OTP. Please try again." } });
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};




// getting enter forgot email otp
exports.getEnterForgotOtp = async (req, res, next) => {
  res.status(200).render("user/forgot_otp", {
    email: req.session.forgotUserEmail
  },
    console.log("this is from getEnterForgotOtp" + req.session.forgotUserEmail)
  );
}


exports.submitForgetOtp = async (req, res, next) => {
  console.log('Session forgetUser:', req.session.forgotUser);
  console.log('Entered OTP:', req.body.Otp);

  try {
    // Check if forgetUser session exists
    if (!req.session.forgotUser) {
      return res.status(400).json({
        customError: `Session expired. Please try again.`,
      });
    }

    // Find user from database
    const user = await Userdb.userCollection.findById(req.session.forgotUser).lean();

    // Check if user exists and has email property
    if (!user || !user.email) {
      return res.status(400).json({
        errors: { otp: { msg: "User not found or invalid email" } }
      });
    }

    // Proceed with OTP validation
    const otpInfo = await Otpdb.otpCollection.findOne({ otpId: req.session.forgotUser });
    if (!otpInfo) {
      return res.status(400).json({
        errors: { otp: { msg: "Invalid OTP" } }
      });
    }

    // Convert OTP values to strings for comparison
    const enteredOtp = String(req.body.Otp).trim();
    const storedOtp = String(otpInfo.otp).trim();

    console.log("Entered OTP:", enteredOtp);
    console.log("Stored OTP:", storedOtp);

    // Validate OTP
    if (storedOtp === enteredOtp) {
      if (otpInfo.expireAt >= Date.now()) {
        return res.json({ redirect: "/user/change_password" });
      } else {
        return res.status(400).json({
          errors: { otp: { msg: "OTP Expired" } }
        });
      }
    } else {
      return res.status(400).json({
        errors: { otp: { msg: "Invalid OTP" } }
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
}





exports.resendForgortPass = async (req, res, next) => {
  try {
    // Debugging information
    console.log("Session Forgot User Email:", req.session.forgotUserEmail);
    // Resend OTP
    const data = await resendOtp(req.session.forgotUserEmail, req.session.forgotUser);

    // Log OTP resend information
    console.log("OTP resent to email:", req.session.forgotUserEmail);
    console.log(data);

    // Ensure success property exists
    if (data.success === undefined) {
      data.success = true;
    }

    // Respond with success data
    res.status(200).json(data);
  } catch (error) {
    // Log and handle errors
    console.error("Error in resendForgortPass:", error);
    res.status(500).json({
      customError: 'Failed to resend OTP. Please try again later.',
      success: false
    });
  }
}

//change password
exports.getChangePassword = async (req, res, next) => {

  res.status(200).render("user/changepassword", {
    changePassword: true
  })


}

exports.changePassword = async (req, res, next) => {
  try {
    if (req.session.forgotUserEmail) {
      const user = await Userdb.userCollection.findOne({ email: req.session.forgotUserEmail });
      if (!user) {
        return res.status(400).json({ customError: 'User not found' });
      }

      const newPassword = await bcrypt.hash(req.body.newPassword, 10);
      const updatedUser = await Userdb.userCollection.updateOne(
        { email: req.session.forgotUserEmail },
        { $set: { password: newPassword } }
      );

      if (updatedUser.modifiedCount > 0) {
        res.status(200).json({ redirectUrl: '/user/login' });
      } else {
        res.status(400).json({ customError: 'Failed to update password' });
      }
    } else {
      res.status(400).json({ customError: 'Session is not found' });
    }
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ customError: 'An error occurred. Please try again later.' });
  }
};





///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


//user home
exports.userHomePage = async (req, res, next) => {
 try {
  const token = req.cookies.token;
  if(token){
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const UserInfo = await Userdb.userCollection.findById(user._id).lean();
    res.status(200).render("user/home", {
      user: true,
      userInfo: UserInfo
    })
  }
  res.status(200).render("user/home", {
    user: true,
    userInfo: null
  }
  )
 } catch (error) {
  console.log(error);
  next(error)
 }

}

function calculateDiscountedPrice(originalPrice, discount) {
  return originalPrice - (originalPrice * discount / 100);
}

//user products
exports.getUserProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const sort = req.query.sort || 'featured';

    let pipeline = [
      {
        $match: { isDeleted: { $in: [true, false] } }
      }
    ];

    if (req.query.search) {
      const search = req.query.search;
      const regex = new RegExp(search, 'i');

      pipeline.push(
        {
          $lookup: {
            from: "category_datas",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $match: {
            $or: [
              { productName: { $regex: regex } },
              { brand: { $regex: regex } },
              { primarymaterial: { $regex: regex } },
              { polishmaterial: { $regex: regex } },
              { "categoryInfo.categoryName": { $regex: regex } },
            ],
          },
        }
      );
    }

    // Add field for case-insensitive sorting
    if (sort === 'name_asc' || sort === 'name_desc') {
      pipeline.push({
        $addFields: {
          productNameLower: { $toLower: "$productName" }
        }
      });
    }
    
    // Sorting
    switch (sort) {
      case 'price_asc':
        pipeline.push({ $sort: { originalprice: 1 } });
        break;
      case 'price_desc':
        pipeline.push({ $sort: { originalprice: -1 } });
        break;
      case 'name_asc':
        pipeline.push({ $sort: { productNameLower: 1 } });
        break;
      case 'name_desc':
        pipeline.push({ $sort: { productNameLower: -1 } });
        break;
      case 'newest':
        pipeline.push({ $sort: { createdAt: -1 } });
        break;
      default:
        pipeline.push({ $sort: { _id: 1 } }); 
        break;
    }

    // Total products count
    const totalProductsResult = await Productdb.productCollection.aggregate([
      ...pipeline,
      { $count: "total" }
    ]).exec();

    const totalProducts = totalProductsResult.length > 0 ? totalProductsResult[0].total : 0;
    const totalPages = Math.ceil(totalProducts / limit);
    const nextPage = page < totalPages ? page + 1 : null;

    // Pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    const products = await Productdb.productCollection.aggregate(pipeline).exec();

    // Check if the request is an AJAX call
    if (req.xhr) {
      return res.json({
        products,
        totalPages,
        page,
      });
    }

    // Render the page for non-AJAX requests
    res.status(200).render("user/user_products", {
      user: true,
      page,
      search: req.query.search || '',
      sort,
      nextPage,
      totalPages,
      totalProducts,
      products,
      calculateDiscountedPrice: calculateDiscountedPrice
    });

  } catch (err) {
    console.error("Error in getUserProducts:", err);
    next(err);
  }
};


//product details
exports.getProductDetails = async (req, res, next) => {
  try {

    const product = await Productdb.productCollection
      .findById(req.params.id)
      .lean();
      const length = product.quantity
    if (req.session.token) {
      const user = jwt.verify(req.session.token, process.env.JWT_SECRET);
      const userInfo = await Userdb.userCollection.findById(user._id).lean();
      const cart = await Cartdb.cartCollection
        .findOne({ userId: new ObjectId(user._id) })
        .lean();
      if (cart) {
        count = cart.products.length;
      } else {
        count = 0;
      }
      res.status(200).render("user/product-details", {
        user: true,
        product,
        userInfo,
        calculateDiscountedPrice: calculateDiscountedPrice,
        length
      })

    } else {
      res.status(200).render("user/product-details", {
        user: true,
        product,
        calculateDiscountedPrice: calculateDiscountedPrice,
        length
      })
    }
  console.log(length, "-------------");
    // const productId = req.params.id; 
    // console.log(productId);
  } catch (error) {
    console.log(error);
    next(error)
  }
}


//get my account
exports.getMyAccount = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userInfo = await Userdb.userCollection.findById(decodedToken._id).lean();

        res.status(200).render("user/my-account", {
          user: true,
          userInfo: userInfo
        });
      } catch (error) {
        // Token verification failed
        res.status(200).render("user/my-account", {
          user: true,
          userInfo: null
        });
      }
    } else {
      // No token provided
      res.status(200).render("user/my-account", {
        user: true,
        userInfo: null
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};


exports.postMyAccount = async (req, res, next) => {
  const { fname, lname, phone, email } = req.body;
  console.log('Request Body:', req.body); // Log request body

  try {
    const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    console.log('Decoded User:', user); // Log decoded user info
    


    if (!fname || !lname || !phone || !email) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    // Check if the new email already exists
    const emailExists = await Userdb.userCollection.findOne({ email: email });
    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Update user information
    await Userdb.userCollection.findByIdAndUpdate(user._id, {
      firstName: fname,
      lastName: lname,
      phone: phone,
      email: email
    });

    // Send success response
    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'An error occurred' });
  }
};


exports.getMyAddress = async (req, res, next) => {
    try {
      const user = verifyToken(req)
      const userInfo = await Userdb.userCollection.findById(user._id)
      const address = await Addressdb.addressCollection.find({
        userId: user._id,
        isDeleted: false
      })
      res.status(200).render("user/my-address",{
        user:true,
        userInfo,
        address,
      })
      console.log("useraddress",address,);
     
    } catch (error) {
      console.log(error);
      next(error)
    }
}

exports.getAddMyAddress = async (req,res, next) => {
  try {
    const user = verifyToken(req)
    const userInfo = await Userdb.userCollection.findById(user._id)
    res.status(200).render("user/add_my_address",{
      user:true,
      userInfo
    })
  } catch (error) {
    console.log(error);
    next(error)
  }
}


exports.addMyAddress = async (req, res, next) => {
  try {
    const user = verifyToken(req)
    const userId = user._id
    const data = {
      userId: new ObjectId(userId),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      homeAddress: req.body.address,
      landmark: req.body.landmark,
      city: req.body.city,
      street: req.body.street,
      state: req.body.state,
      phone: req.body.phone,
      country: req.body.country,
      pincode: req.body.pincode

    };
    console.log(data);
    console.log("---------------------------");
    const address = await Addressdb.addressCollection.insertMany(data);
    if (address) {
  
      res.status(201).json({
        success: true
      })
    }

  } catch (error) {
    console.log(error);
    next(error)
  }

}

// edit address---------------------------------
exports.getEditMyAddress = async (req, res, next) => {
  try {
    const user = verifyToken(req);
    const userInfo = await Userdb.userCollection.findById(user._id);
    const addressId = req.params.id;
    const address = await Addressdb.addressCollection.findById(addressId);

    res.status(200).render("user/edit_my_address", {
      user: true,
      address: [address], 
      userInfo
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.editMyAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const updatedAddress = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      homeAddress: req.body.address,
      landmark: req.body.landmark,
      city: req.body.city,
      street: req.body.street,
      state: req.body.state,
      phone: req.body.phone,
      country: req.body.country,
      pincode: req.body.pincode
    };

    const address = await Addressdb.addressCollection.findByIdAndUpdate(
      addressId,
      { $set: updatedAddress },
      { returnDocument: 'after', new: true }
    );

    if (address) {
      res.status(200).redirect("/user/my-address");
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// setting new password
exports.getSetNewPassword = async (req, res, next) => {
  try {
    const user = verifyToken(req)
    const userInfo = await Userdb.userCollection.findById(user._id);
    res.status(200).render("user/setNewPassword", {
      user: true,
      userInfo,
    });
  } catch (error) {
    console.log(error);
    next(error)
  }
}

exports.setNewPassword = async (req, res, next) => {
  try {
    const user = verifyToken(req);
    const userInfo = await Userdb.userCollection.findById(user._id);

    const { currentpassword, newpassword, confirmpassword } = req.body;

    console.log(currentpassword, "currentpassword");

   
    const isMatch = await bcrypt.compare(currentpassword, userInfo.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        errors:{currentpassword:{msg:"Current password is incorrect"}}
      });
    }

    
    if (newpassword !== confirmpassword) {
      return res.status(400).json({
        success: false,
        errors:{confirmpassword:{msg:"New password and confirm password should be the same"}}
      });
    }

    
    const hashedPassword = await bcrypt.hash(newpassword, 10);

   
    await Userdb.userCollection.findByIdAndUpdate(user._id, { password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.log(error);
    next(error);
  }
}

  // delete address------------------------------
  exports.deleteAddress = async (req, res, next) => {
    try {
        const addressId = req.params.id;
        await Addressdb.addressCollection.updateOne(
            { _id: addressId },
            { $set: { isDeleted: true } }
        );
        res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "An error occurred while deleting the address" });
        next(error);
    }
};

//functions------->>>>>>>>>>>>>>>>>>>>>>>>>>>>
const verifyToken = (req) => {
  const token = req.cookies.token;
  if (token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
  return null;
};
const calculateCartDetails = async (userId) => {
  try {
    const user = await Userdb.userCollection.findById(userId).lean();
    const cart = await Cartdb.cartCollection.findOne({ userId: user._id }).lean();
    const hadAddress = user.address ? 'true' : 'false';
    
    if (!cart || cart.products.length === 0) {
      return {
        userInfo: user,
        products: [],
        total: 0,
        savings: 0,
        hadAddress,
      };
    }

    const products = await Productdb.productCollection.find({
      '_id': { $in: cart.products.map(p => p.productId) }
    }).lean();

    const cartProducts = products.map(product => {
      const cartProduct = cart.products.find(p => p.productId.equals(product._id));
      return {
        ...product,
        quantity: cartProduct.quantity,
        originalPrice: product.originalprice,
        price: calculateDiscountedPrice(product.originalprice, product.discount) * cartProduct.quantity
      };
    });

    const total = cartProducts.reduce((sum, p) => sum + p.price, 0);
    const savings = cartProducts.reduce((sum, p) => sum + (p.originalPrice * p.quantity - p.price), 0);
    const packingCharges = 0;
    const shippingHandling = 0; 
    const tax = total * 0.18; 
    return {
      userInfo: user,
      products: cartProducts,
      total,
      savings,
      hadAddress,
      shippingHandling,
      packingCharges,
      tax
    };
  } catch (error) {
    console.error("Error calculating cart details:", error);
    throw new Error("Internal server error");
  }
};


exports.getCart = async (req, res,next) => {
  try {
   
    const user = verifyToken(req);
    const userId = user._id;

    const cartDetails = await calculateCartDetails(userId);

    res.render('user/addtocart', {
      userInfo: cartDetails.userInfo,
      products: cartDetails.products,
      total: cartDetails.total,
      savings: cartDetails.savings,
      user: true,
      hadAddress: cartDetails.hadAddress,
    });
  } catch (error) {
    console.error("Error getting cart details:", error);
    res.status(500).send("Internal server error");
  }
};

// Controller to handle adding products to the cart
exports.addToCart = async (req, res,next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        message: 'Authentication token is missing'
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken._id;
    const productId = req.params.id;
    const { quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required'
      });
    }

    const product = await Productdb.productCollection.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }
    if (!product.inStock) {
      return res.status(400).json({
        message: 'Product is out of stock'
      })
    }
  
    let cart = await Cartdb.cartCollection.findOne({ userId });

    if (!cart) {
      
      cart = new Cartdb.cartCollection({
        userId,
        products: [{
          productId,
          quantity: quantity || 1,
          price: calculateDiscountedPrice(product.originalprice, product.discount) * (quantity || 1),
          originalPrice: product.originalprice * (quantity || 1)
        }]
      });
      await cart.save();
      return res.status(201).json({
        message: 'Product added to new cart',
        cart,
        updatedProductPrice: cart.products[0].price,
        updatedOriginalPrice: cart.products[0].originalPrice,
        cartTotal: cart.products.reduce((total, item) => total + item.price, 0)
      });
    }

    const productIndex = cart.products.findIndex(item => item.productId.toString() === productId);
    if (productIndex > -1) {
      // Update quantity and price of existing product
      cart.products[productIndex].quantity = quantity || 1; // Set the quantity to the new value
      cart.products[productIndex].price =
        calculateDiscountedPrice(product.originalprice, product.discount) * cart.products[productIndex].quantity;
      cart.products[productIndex].originalPrice = product.originalprice * cart.products[productIndex].quantity;
    } else {
      // Add new product to cart
      cart.products.push({
        productId,
        quantity: quantity || 1,
        price: calculateDiscountedPrice(product.originalprice, product.discount) * (quantity || 1),
        originalPrice: product.originalprice * (quantity || 1)
      });
    }

    await cart.save();
  // update the price of the product----------
    const updatedProductPrice = productIndex > -1 ?
     cart.products[productIndex].price :calculateDiscountedPrice(product.originalprice, product.discount) * (quantity || 1);

    const updatedOriginalPrice = productIndex > -1 ? 
    cart.products[productIndex].originalPrice : product.originalprice * (quantity || 1);

    const cartTotal = cart.products.reduce((total, item) => total + item.price, 0);
    

    res.status(200).json({
      message: 'Product added to cart',
      cart,
      updatedProductPrice,
      updatedOriginalPrice,
      cartTotal,
    });

  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//remove from art
exports.removeFromCart = async (req, res, next) => {
  try {
  
    const userInfo = jwt.verify(req.cookies.token, process.env.JWT_SECRET);

    const productId = req.params.id;
    
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const updatedCart = await Cartdb.cartCollection.updateOne(
      { userId: new ObjectId(userInfo._id) },
      { $pull: { products: { productId: new ObjectId(productId) } } }
    );

   
    if (updatedCart.modifiedCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Product not found in cart' });
    }
  } catch (err) {
    console.error('Error removing product from cart:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// user logout
exports.userLogout = (req, res, next) => {
  res.clearCookie("token");
  res.json({ success: true }); 
}

exports.getCheckout = async (req, res, next) => {
  try {
    if (!req.cookies.token) {
      return res.redirect('/user/login');
    }
  
    const decodedToken = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = decodedToken._id;
    const user = await Userdb.userCollection.findById(userId)
    console.log(user,"==");
    // checking if the user if blocked or not
    if(user.isBlocked){
       return res.status(400).json({
        success:false,
        message:"User access is denied"
       })
    }
    const address = await Addressdb.addressCollection.find({ userId , isDeleted:false})
    const cartDetails = await calculateCartDetails(userId);

    const id = req.params.id;

    if (req.method === 'POST' && req.body.selectedAddress) {
      const selectedAddressId = req.body.selectedAddress;
      const selectedAddress = await Addressdb.addressCollection.findOne({ _id: selectedAddressId, userId });

      if (selectedAddress) {
        req.session.selectedAddress = selectedAddress;
      }
      console.log(selectedAddress, "selectedAddress");
    }
    res.render('user/checkoutAddress', {
      userInfo: cartDetails.userInfo,
      products: cartDetails.products,
      total: cartDetails.total,
      savings: cartDetails.savings,
      user: true,
      hadAddress: cartDetails.hadAddress,
      address: address,
      shippingHandling: cartDetails.shippingHandling,
      packingCharges: cartDetails.packingCharges,
      tax: cartDetails.tax,
      id: id
  

    });
  } catch (error) {
    console.error("Error getting checkout details:", error);
    res.status(500).send("Internal server error");
  }
};

// exports.selectAddress = async(req,res, next ) => {
//   try {
//     const selectedAddress = req.body.selectedAddress
//     console.log(selectedAddress, "selectedAddress");
//     if(selectedAddress){
//       req.session.selectedAddress = selectedAddress
//       next()
//     // }else{
//     //   res.status(400).json({
//     //     message: "Address not found",
//     //   })
//     }
    

//   } catch (error) {
//     console.log(error);
//     next(error)
//   }
// }

exports.getPaymentMethod = async (req, res, next) => {

  try {
    const userId = req.params.id

    // Fetch the cart details for the user
    const cart = await Cartdb.cartCollection.findOne({ userId }).lean();

    const cartDetails = await calculateCartDetails(userId);

    res.render("user/paymentMethod", {
      userId,
      user: true,
      products : cartDetails.products,
      total    : cartDetails.total,
      savings  : cartDetails.savings,
      packingCharges : cartDetails.packingCharges,
      shippingHandling : cartDetails.shippingHandling,
      tax : cartDetails.tax
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { paymentMethod } = req.body;
    const user = verifyToken(req);
    const userInfo = user.id;

  
    const cartDetails = await calculateCartDetails(userId);

    
    if (cartDetails.products.length === 0) {
      return res.status(400).render('user/paymentMethod', {
        userId,
        user: true,
        products: [],
        total: 0,
        savings: 0,
        packingCharges: 0,
        shippingHandling: 0,
        tax: 0,
        error: 'Your cart is empty.'
      });
    }


    const address = await Addressdb.addressCollection.findOne({ userId, isPrimary:false }).lean();

    if (!address) {
      return res.status(400).json({ message: 'No primary address found' });
    }
 
    const orderPromises = cartDetails.products.map(async (product) => {
      
      const transactionId = uuidv4();

    
      const order = new Orderdb.orderCollection({
        userId,
        orderItems: [{
          productId: product._id,
          quantity: product.quantity,
          price: product.price 
        }],
        shippingAddress: req.session.selectedAddress || address,
        billingAddress: req.session.selectedAddress || address,
        totalAmount: product.price * product.quantity, 
        paymentMethod,
        transactionId,
        orderStatus: 'Pending',
        paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Pending'
      });

      
      await order.save();
    console.log(product.quantity);
    // Update the product quantity
    await Productdb.productCollection.updateOne(
      { _id: product._id },
      { $inc: { quantity: -product.quantity } } 
    );
  });
       
 
    //wait for all orders
    await Promise.all(orderPromises);

    //clear cart
    await Cartdb.cartCollection.updateOne({ userId }, { $set: { products: [] } });


    res.redirect(`/user/orders/${userId}`);

  } catch (error) {
    console.error(error);
    next(error);
  }
};

// order details fetching fucnction
// const getOrderDetailsWithProductInfo = async (orders) => {
//   // Extract product IDs from all orders
//   const productIds = orders.flatMap(order => 
//     order.orderItems.map(item => item.productId.toString())
//   );

//   // Remove duplicates
//   const uniqueProductIds = [...new Set(productIds)];

//   // Fetch all products at once
//   const products = await Productdb.productCollection.find({ '_id': { $in: uniqueProductIds.map(id => new ObjectId(id)) } }).lean();
//   console.log('Fetched Products:', products); // Debug: Check fetched products

//   // Create a map of products keyed by product ID
//   const productsMap = new Map(products.map(product => [product._id.toString(), product]));

//   // Enrich orders with product details
//   const updatedOrders = orders.map(order => ({
//     ...order,
//     orderItems: order.orderItems.map(item => {
//       const product = productsMap.get(item.productId.toString());
//       console.log(`Mapping Product ID: ${item.productId.toString()}`); // Debug: Check mapping
//       return {
//         ...item,
//         productName: product ? product.productName : 'Unknown Product',
//         productPrice: product ? product.originalprice : 0,
//       };
//     })
//   }));

//   return updatedOrders;
// };

// exports.getMyOrders = async (req, res) => {
//   const token = req.cookies.token;
//   try {
//     const userId = req.params.id;

//     // Fetch user information
//     const userInfo = await Userdb.userCollection.findById(userId).lean();

//     // Fetch orders
//     const orders = await Orderdb.orderCollection.find({ userId }).lean();

//     // Enrich orders with product details
//     const updatedOrders = await getOrderDetailsWithProductInfo(orders);

//     // Console log each product's details
//     updatedOrders.forEach(order => {
//       console.log(`Order ID: ${order._id}`);
//       order.orderItems.forEach(item => {
//         console.log(`Product Name: ${item.productName}`);
//         console.log(`Quantity: ${item.quantity}`);
//         console.log(`Price: ₹${(item.productPrice ).toFixed(2)}`);
//       });
//     });
    
//     // Render orders with product images
//     res.status(200).render("user/orders", {
//       user: true,
//       orders: updatedOrders,
//       userId,
//       userInfo,
//       images: updatedOrders.length > 0 ? updatedOrders[0].orderItems[0].productImage : [],
//     });
   
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userInfo = await Userdb.userCollection.findById(userId).lean();
    // Fetch orders for the user
    const orders = await Orderdb.orderCollection.find({ userId }).lean();
    const orderId = orders.map(order => order._id);

    // Extract product IDs from the orders
    const productIds = [];
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        productIds.push(item.productId);
      });
    });

    // Fetch product details using the extracted product IDs
    const products = await Productdb.productCollection.find({ _id: { $in: productIds } }).lean();

    // Create a map for quick lookup of product details
    const productMap = {};
    products.forEach(product => {
      productMap[product._id] = {
        name: product.productName,
        image: product.images
      };
    });

    // Process and format the orders with product details
    const orderDetails = orders.map(order => {
      // Calculate the total price for each order
      const totalPrice = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      return {
        _id: order._id,
        transactionId: order.transactionId,
        items: order.orderItems.map(item => ({
          quantity: item.quantity,
          price: item.price,
          name: productMap[item.productId]?.name || 'Unknown',
          image: productMap[item.productId]?.image || 'No image'
        })),
        totalPrice,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        orderDate: order.orderDate,
        paymentMethod: order.paymentMethod
      };
    });

    // Send the formatted order details to the frontend
    res.status(200).render("user/orders", {
    user:true,
    orders: orderDetails,
    userInfo,

    
  })
} catch (error) {
    console.error(error);
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;


    const result = await Orderdb.orderCollection.updateOne(
      { _id: orderId },
      { orderStatus: 'Cancelled' }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ success: false, message: 'Order not found or already cancelled.' });
    }

    res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
};