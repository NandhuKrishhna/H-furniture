
const Admindb = require("../models/adminModels");
const Userdb = require("../models/UserModels");
const Productdb = require("../models/productModels");
const Categorydb = require("../models/categoryModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb")
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const Orderdb = require("../models/orderModel");
const { isError } = require("util");
const Coupondb = require("../models/couponModel")



// Get login page
exports.getAdminLogin = async (req, res, next) => {
  try {
    if (req.cookies.adminToken) {
      const token = req.cookies.adminToken;
      console.log("Token:", token);
      try {
        const admin = jwt.verify(token, process.env.ADMIN_SECRET);
        console.log("Admin:", admin);
        if (admin) {
          return res.redirect("/admin/user_panel");
        } else {
          return res.status(200).render("admin/login", {
            message: null,
          
            // Set the title here
          });
        }
      } catch (err) {
        console.log("Token verification failed:", err);
        return res.status(200).render("admin/login", {
          message: null,
          
            // Set the title here
        });
      }
    } else {
      console.log("No token found, rendering login page");
      return res.status(200).render("admin/login", {
        message: null,
       
       
      });
    }
  } catch (error) {
    console.log("Error in getAdminLogin:", error);
    return res.status(500).send("Internal Server Error");
  }
};



// Verify admin login

exports.verifyAdminLogin = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);


  

  try {
    const admin = await Admindb.adminCollection.findOne({ email: req.body.email });

    if (!admin) {
      return res.status(404).render("admin/login", {
        message: "Incorrect email or password",
      })
    
    
    }

    const passwordValid = await bcrypt.compare(req.body.password, admin.password);

    if (!passwordValid) {
      return res.status(404).render("admin/login", {
        message: "Incorrect email or password",
     
      });
    }

    const { _id } = admin;
    if (passwordValid) {
      const adminToken = jwt.sign({ _id }, process.env.ADMIN_SECRET);
      res.cookie("adminToken", adminToken, { httpOnly: true });
      console.log("Hi, admin entered the admin panel");
      return res.redirect("/admin/user_panel");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};



exports.userManagement = async (req, res, next) => {
  try {
    console.log(req.query);
      const users = await Userdb.userCollection.find({}).lean();
      const userData = convertDate(users);

      res.status(200).render("admin/user_panel", {
          adminUser: true,
          users: users, 
          userData ,
         
      });
  } catch (error) {
      next(error);
  }
};
exports.userSearch = async (req, res, next) => {
  try {
    const users = await Userdb.userCollection.find(req.query)
    res.status(200).json({
       success: true,
       data: users
    })



  } catch (error) {
    res.status(400).json({
      sucess: false,
      error: error.message
    });
  }
}


// to convert data to a readable format

function convertDate(users){
  users.forEach(element => {
    element.createdAt = new Date(element.createdAt).toLocaleString()
    element.updatedAt = new Date(element.updatedAt).toLocaleString()
  });
  return users;
}

exports.blockUser = async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);
    const user = await Userdb.userCollection.updateOne(
      { _id: id },
      { $set: { isBlocked: true } }
    );
    if (user.modifiedCount) {
      res.sendStatus(200);
    }
  } catch (err) {
    next(err);
  }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);
    const user = await Userdb.userCollection.updateOne(
      { _id: id },
      { $set: { isBlocked: false } }
    );
    console.log("This is users id:", id);
    if (user.modifiedCount) {
      res.sendStatus(200);
    }
  } catch (err) {
    next(err);
  }
};



// getting Catergory Page
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection
      .find({ isDeleted: false })
      .lean();
   const categoryData = convertDate(category)
    res.status(200).render("admin/admin-category", {
      adminUser: true,
      category: true,
      category,
      categoryData,
     
    });
  } catch (er) {
    next(er);
  }
};

// getting Add catergory Page
exports.getAddCategory = (req, res, next) => {
  try {
    res.status(200).render("admin/add-category", {
      adminUser: true,
      addCategory: true,
     
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Add new catergory
exports.addCategory = async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection.find({
      categoryName: { $regex: req.body.categoryName, $options: "i" },
      isDeleted: false,
    });
    if (category.length > 0) {
      res.status(200).render("admin/add-category", {
        adminUser: true,
        addCategory: true,
        categoryExist: true,
        
      });
    } else {
      const data = {
        categoryName: req.body.categoryName.toUpperCase(),
      };
      console.log(req.body.categoryName);
      

      const addCategory = await Categorydb.categoryCollection.insertMany(data);
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const deletedProduct =
      await Categorydb.categoryCollection.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
      });
    if (deletedProduct) {
      res.sendStatus(200);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};
// getting the edit category page
exports.getEditcategory = async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection
      .findById(req.params.id)
      .lean();

    res.status(200).render("admin/edit-category", {
      adminUser: true,
      editCategory: true,
      categoryInfo: category,
    
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};



exports.editCategory = async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection.find({
      categoryName: { $regex: req.body.categoryName, $options: "i" },
      isDeleted: false,
    });
    if (category.length > 0) {
      res.status(400).render("admin/edit-category", {
        adminUser: true,
        editCategory: true,
        categoryExist: true,
      });
    } else {
      const updatedCat = await Categorydb.categoryCollection.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            categoryName: req.body.categoryName.toUpperCase(),
          },
        }
      );
      console.log(req.body.categoryName);
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
//getting admin product
exports.getAdminProduct = async (req, res, next) => {
  try {
    const products = await Productdb.productCollection.aggregate([
      { $match: { isDeleted: false, },  },
      {     
        $lookup: {
          from: "category_datas",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ]);

    const productsData = convertDate(products);

    res.status(200).render("admin/admin-products", {
      adminUser: true,
      products: true,
      productsData,
    
    });
  } catch (err) {
    next(err);
  }
};


// getting product adding page
exports.adminaddProduct = async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection.find().lean();
    res.status(200).render("admin/add-products", {
      adminUser: true,
      addProducts: true,
      category,
  
    });
  } catch (error) {
    next(error);
  }
};




// admin adding products
exports.addProduct = async (req, res, next) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    const resizedImages = await Promise.all(req.files.map(async (file) => {
      const imagePath = `uploads/${file.filename}`;
      const resizedImagePath = `uploads/resized_${file.filename}`;

      try {
      
        await sharp(imagePath)
          .resize(400, 400, {
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
          })
          .withMetadata() 
          .sharpen() 
          .toFormat('jpeg', { quality: 90 })
          .toFile(resizedImagePath);

     
        await fs.unlink(imagePath);
        console.log("Image deleted successfully:", imagePath);
        
        return resizedImagePath;
      } catch (sharpError) {
        console.error("Error resizing image:", sharpError);
        throw sharpError;
      }
    }));
    
    console.log('Resized images:', resizedImages);
    const category = await Categorydb.categoryCollection.findOne({
      categoryName: { $regex: req.body.category, $options: "i" }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const productdata = {
      productName: req.body.productname,
      description: req.body.description,
      originalprice: req.body.originalprice,
      discount: req.body.discount,
      category: category._id,
      weight: req.body.weight,
      quantity: req.body.quantity,
      brand: req.body.brand,
      primarymaterial: req.body.primarymaterial,
      floorstanding: req.body.floorstanding,
      polishmaterial: req.body.polishmaterial,
      color: req.body.color,
      material: req.body.material,
      images: resizedImages,
      countryofOrigin: req.body.countryofOrigin,
      warranty: req.body.warranty,
      dimension: req.body.dimension,
      fabric_options: req.body.fabric_options,
    };
    
    console.log(productdata);

    const product = await Productdb.productCollection.insertMany(productdata);
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//getting edit product page
exports.getEditProduct = async (req, res, next) => {
  try {
    const categoryData = await Categorydb.categoryCollection.find({}).lean();

    const id = new ObjectId(req.params.id);
    const product = await Productdb.productCollection.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: "category_datas",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ]);

    res.status(200).render("admin/edit-products", {
      adminUser: true,
      editProduct: true,
      categoryData,
      product,
   
    });
  } catch (error) {
    console.log(error);
    next(error); 
};

}


// admin editing products
exports.editProduct = async (req, res, next) => {
  try {
    // console.log(req.body);
    // console.log(req.files);

    const id = new ObjectId(req.params.id);

   
    const product = await Productdb.productCollection.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'category_datas',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
    ]);


    const updateProduct = await Productdb.productCollection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          productName: req.body.productname,
          description: req.body.description,
          originalprice: req.body.originalprice,
          discount: req.body.discount,
          weight: req.body.weight,
          quantity: req.body.quantity,
          brand: req.body.brand,
          primarymaterial: req.body.primarymaterial,
          floorstanding: req.body.floorstanding,
          polishmaterial: req.body.polishmaterial,
          color: req.body.color,
          material: req.body.material,
          countryofOrigin: req.body.countryofOrigin,
          warranty: req.body.warranty,
          dimension: req.body.dimension,
          fabric_options: req.body.fabric_options,
          inStock: req.body.quantity > 0 ? true : false,
          updatedAt: Date.now(),
        },
      },
      { returnDocument: 'after' }
    );

    
    if (req.files && req.files.length > 0) {
      const resizedImages = await Promise.all(req.files.map(async (file) => {
        const imagePath = `uploads/${file.filename}`;
        const resizedImagePath = `uploads/resized_${file.filename}`;

        try {
          // Resize image using Sharp
          await sharp(imagePath)
            .resize({ width: 400, height: 400 })
            .toFile(resizedImagePath);

          // Delete original image after resizing
          await fs.unlink(imagePath);
          console.log("Image deleted successfully:", imagePath);

          return resizedImagePath;
        } catch (sharpError) {
          console.error("Error resizing image:", sharpError);
          throw sharpError;
        }
      }));

      
      await Productdb.productCollection.findOneAndUpdate(
        { _id: id },
        { $set: { images: resizedImages } },
        { returnDocument: 'after' }
      );
    }


    if (req.body.category){
      
      const category = await Categorydb.categoryCollection.findOne({
        categoryName: { $regex: req.body.category, $options: 'i' },
      });

    
      await Productdb.productCollection.findOneAndUpdate(
        { _id: id },
        { $set: { category: category._id } },
        { returnDocument: 'after' }
      );
    

  
  }res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
    next(err);
  }
};






exports.deleteProduct = async (req, res, next) => {
  try {
    const deleteProduct = await Productdb.productCollection.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } }
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    next(err);
  }
};





exports.adminLogout = async (req, res, next) => {
  try {
    res.clearCookie("adminToken");
    res.redirect("/admin/login");
  } catch (error) {
    next(error);
  }
}


exports.getOrdersPage = async (req, res, next) => {
  try {
   
   const orders = await Orderdb.orderCollection.find().lean();
    
    res.status(200).render("user/orders",{orders})


   } catch (error) {
    console.log(error);
    next(error)
   }
}
  


exports.updateOrderStatus = async (req, res, next) => {
  try {
      const { orderId, status } = req.body;
      console.log(req.body);
      await Orderdb.orderCollection.findByIdAndUpdate(orderId, { orderStatus: status });
      res.status(200).json({ message: 'Order status updated successfully.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating order status.' });
  }
};

exports.couponManagement = async (req, res, next ) => {
    try{
      
    const coupons =   await Coupondb.couponCollection.find()

   
      res.status(200).render("admin/coupons",{
        coupons
      })
    

    }catch(error){
     console.log(error);
     next(error)
    }
}

exports.getAddCouponPage =  async (req,res,next)=>{
     try {
      res.status(200).render("admin/add-coupons")

     } catch (error) {
      console.log(error);
      next(error)
     }
}
exports.addCoupon = async (req,res,next)=>{
  try {
    const data = {
      code: req.body.code,
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      maxDiscount: req.body.maxDiscount,
      minPurchaseAmount: req.body.minPurchaseAmount,
      usageLimit: req.body.usageLimit,
      validFrom: req.body.validFrom,
      validUntil: req.body.validUntil,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    console.log(data);
    const dataExit = await Coupondb.couponCollection.findOne({code: req.body.code})
    if(dataExit){
      return res.status(400).json({
        success:false,
        message: "Coupon code already exist"
      })
    }
     const coupon = new Coupondb.couponCollection(data)
     await coupon.save()
     res.status(200).redirect('/admin/coupons').json({
      success:true,
      message: "Coupon added successfully"
     })
  
    
  } catch (error) {
    console.log(error);
    next(error)
  }
}