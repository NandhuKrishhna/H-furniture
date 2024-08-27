
const Admindb = require("../models/adminModels");
const Userdb = require("../models/UserModels");
const Productdb = require("../models/productModels");
const Categorydb = require("../models/categoryModel");
const Orderdb = require("../models/orderModel");
const Coupondb = require("../models/couponModel")
const Wallectdb = require("../models/walletModel")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb")
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const { isError } = require("util");
const puppeteer = require("puppeteer");
const {fetchOrderData} = require("../utils/helpers")

function convertDate(users){
  users.forEach(element => {
    element.createdAt = new Date(element.createdAt).toLocaleString()
    element.updatedAt = new Date(element.updatedAt).toLocaleString()
  });
  return users;
}

module.exports ={


// Get login page
getAdminLogin : async (req, res, next) => {
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
          
          });
        }
      } catch (err) {
        console.log("Token verification failed:", err);
        return res.status(200).render("admin/login", {
          message: null,
          
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
},

// Verify admin login

verifyAdminLogin: async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const admin = await Admindb.adminCollection.findOne({ email: req.body.email });

    if (!admin) {
      return res.status(404).json({
         customError: "Incorrect email or password" 
        });
    }

    const passwordValid = await bcrypt.compare(req.body.password, admin.password);

    if (!passwordValid) {
      return res.status(404).json({
         customError: "Incorrect email or password"
         });
    }

    const { _id } = admin;
    if (passwordValid) {
      const adminToken = jwt.sign({ _id }, process.env.ADMIN_SECRET);
      res.cookie("adminToken", adminToken, { httpOnly: true });
      return res.status(200).json({
         success: true,
          message: "Login successful"
         });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
},


userManagement : async (req, res, next) => {
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
},
userSearch : async (req, res, next) => {
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
},

// to convert data to a readable format
blockUser : async (req, res, next) => {
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
},

unblockUser : async (req, res, next) => {
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
},


// getting Catergory Page
getCategory : async (req, res, next) => {
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
},

// getting Add catergory Page
getAddCategory : (req, res, next) => {
  try {
    res.status(200).render("admin/add-category", {
      adminUser: true,
      addCategory: true,
     
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
},

// Add new catergory
addCategory: async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection.find({
      categoryName: { $regex: req.body.categoryName, $options: "i" },
      isDeleted: false,
    });
    
    if (category.length > 0) {
      return res.status(200).json({
        success: false,
        customError: "Category already exists.",
      });
    } else {
      const data = {
        categoryName: req.body.categoryName.toUpperCase(),
      };
      
      await Categorydb.categoryCollection.insertMany(data);
      return res.status(200).json({
        success: true,
        message: "Category added successfully.",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
},


deleteCategory : async (req, res, next) => {
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
},
// getting the edit category page
getEditcategory : async (req, res, next) => {
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
},

editCategory: async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection.find({
      categoryName: { $regex: req.body.categoryName, $options: "i" },
      isDeleted: false,
    });
    if (category.length > 0) {
      res.status(400).json({ 
        success: false,
        customError: "Category already exists." 
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
      res.status(200).json({
        success: true,
        message: "Category updated successfully.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false, 
      customError: "An unexpected error occurred." 
    });
  }
},

//getting admin product
getAdminProduct : async (req, res, next) => {
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
      { $sort: { createdAt: -1 } },
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
},


// getting product adding page
adminaddProduct : async (req, res, next) => {
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
},


addProduct : async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.files);

    const resizedImages = [];
    for (const file of req.files) {
      const imagePath = `uploads/${file.filename}`;
      const resizedImagePath = `uploads/resized_${file.filename}`;

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

      resizedImages.push(resizedImagePath);
    }

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
      inStock: req.body.quantity > 0 ? true : false
    };

    console.log(productdata);

    await Productdb.productCollection.insertMany(productdata);
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    next(error);
  }
},


//getting edit product page
getEditProduct : async (req, res, next) => {
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

},


// admin editing products
editProduct: async (req, res, next) => {
  try {
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
    ])

 
    if (!product.length) {
      return res.status(404).send('Product not found');
    }

    const updateFields = {
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
      updatedAt: new Date(), 
    };

    await Productdb.productCollection.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

   
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imagePath = `uploads/${file.filename}`;
        const resizedImagePath = `uploads/resized_${file.filename}`;

        await sharp(imagePath)
          .resize({ width: 400, height: 400 })
          .toFile(resizedImagePath);

        await fs.unlink(imagePath); 
        console.log("Image resized and deleted:", imagePath);
      }
    }
    if (req.body.category) {
      const category = await Categorydb.categoryCollection.findOne({
        categoryName: { $regex: req.body.category, $options: 'i' },
      });

      if (category) {
        await Productdb.productCollection.findOneAndUpdate(
          { _id: id },
          { $set: { category: category._id } },
          { returnDocument: 'after' }
        );
      }
    }

    
    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
    next(err); 
  }
},


deleteProduct: async (req, res, next) => {
  try {
    const deleteProduct = await Productdb.productCollection.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } }
    );

    if (deleteProduct) {
      res.sendStatus(200);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
},



adminLogout : async (req, res, next) => {
  try {
    res.clearCookie("adminToken");
    res.redirect("/admin/login");
  } catch (error) {
    next(error);
  }
},


getOrdersPage : async (req, res, next) => {
  try {
    const orders = await Orderdb.orderCollection.find().sort({ orderDate: -1 }).lean();
    console.log('Orders:', orders); 
    
    res.status(200).render("admin/order_management",{orders})
  } catch (error) {
    console.log(error);
    next(error)
  }
},

 orderDetails : async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    console.log(orderId, itemId);


    const order = await Orderdb.orderCollection.findById(orderId)
      .populate({
        path: 'orderItems.productId',
        model: 'product_data', 
      })
      .populate({
        path: 'userId',
        model: 'user_data',
      });

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found' 
      });
    }

    const item = order.orderItems.find(item => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ 
        message: 'Item not found in the order' 
      });
    }
    console.log("Item:",item);

    
    const user = await Userdb.userCollection.findById(order.userId).select('email');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
       });
    }
    res.status(200).render('admin/orderDetails', {
      order,
      item,
      updatedAt: order.updatedAt,
      userEmail: user.email, 
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
},

  

updateOrderStatus: async (req, res, next) => {
 
    try {
      const { orderId, itemId, status } = req.body;
      
      await Orderdb.orderCollection.updateOne(
        { _id: orderId, 'orderItems._id': itemId },
        { $set: { 'orderItems.$.status': status } }
      );
  
      res.status(200).json({ message: 'Product status updated successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating product status.' });
    }
  },


  approveReturn: async (req, res, next) => {
    try {
      const { orderId, itemId } = req.body;
      console.log(req.body);
  

      const updatedOrder = await Orderdb.orderCollection.findOneAndUpdate(
        { _id: orderId, 'orderItems._id': itemId },
        { 
          $set: { 
            'orderItems.$.status': 'Returned',
            'orderItems.$.returnRequest.status': 'Approved',
            'orderItems.$.returnRequest.approvalDate': new Date(),
          }
        },
        { new: true }
      );
      

      const updatedItem = updatedOrder.orderItems.find(item => item._id.toString() === itemId);
      console.log('Updated Item:', updatedItem);
  

      const refundAmount = updatedItem.price - updatedItem.discountValue;
      console.log('Refund Amount:', refundAmount);
      res.status(200).json({ 
        success: true,
        message: "Return request approved successfully" 
      });
  
      // ----- Amount refund to wallet -----
      const user = await Userdb.userCollection.findById(updatedOrder.userId);
      console.log('User:', user);
  
      if (updatedItem) {
        let wallet = await Wallectdb.walletCollection.findOne({ userId: user._id });
        console.log('Existing Wallet:', wallet);
  
        if (wallet) {
          wallet.balance += refundAmount;
          wallet.history.push({
            transactionType: "Refunded",
            amount: refundAmount,
            date: new Date()
          });
          await wallet.save();
        } else {
          const newWallet = new Wallectdb.walletCollection({
            userId: user._id,
            balance: refundAmount,
            history: [{
              transactionType: 'Refunded',
              amount: refundAmount,
              date: new Date()
            }]
          });
          console.log('New Wallet Created:', newWallet);
          await newWallet.save();
        }
      }
  
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  

  rejectReturn: async (req, res, next) => {
    try {
      const { orderId, itemId } = req.body;
      console.log(req.body);
      const updatedOrder = await Orderdb.orderCollection.findOneAndUpdate(
        { _id: orderId, 'orderItems._id': itemId },
        { 
          $set: { 
            'orderItems.$.returnRequest.status': 'Rejected',
            'orderItems.$.returnRequest.approvalDate': new Date(),
          }
        },
        { new: true }
      );

      const updatedItem = updatedOrder.orderItems.find(item => item._id.toString() === itemId);
      console.log('Updated Item:', updatedItem);
      res.status(200).json({ 
        success: true,
        message: "Return request rejected successfully" 
      });
  
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  


couponManagement : async (req, res, next ) => {
    try{
      
    const coupons =   await Coupondb.couponCollection.find({
      isDeleted: false
    })

    console.log(coupons);
      res.status(200).render("admin/coupons",{
        coupons
      })
    

    }catch(error){
     console.log(error);
     next(error)
    }
},

getAddCouponPage :  async (req,res,next)=>{
     try {
      res.status(200).render("admin/add-coupons")

     } catch (error) {
      console.log(error);
      next(error)
     }
},
addCoupon : async (req, res, next) => {
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
    };
    console.log(data);
    const dataExit = await Coupondb.couponCollection.findOne({ code: req.body.code });
    if (dataExit) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists"
      });
    }
    const coupon = new Coupondb.couponCollection(data);
    await coupon.save();
    
    res.redirect('/admin/coupons');

  } catch (error) {
    console.log(error);
    next(error);
  }
},


getEditCoupon : async (req,res,next)=> {
  
  try {
    
   const couponId = req.params.id;
   const coupon = await Coupondb.couponCollection.findById(couponId)
   res.status(200).render("admin/edit-coupons",{
    coupon
  })


  } catch (error) {
    console.log(error);
    next(error)
  }

},

editCoupon : async (req, res, next) => {
  try {
    const couponId = req.params.id;
    const updatedData = {
      code: req.body.code,
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      maxDiscount: req.body.maxDiscount,
      minPurchaseAmount: req.body.minPurchaseAmount,
      usageLimit: req.body.usageLimit,
      validFrom: req.body.validFrom,
      validUntil: req.body.validUntil,
      updatedAt: new Date()
    };

    console.log('Updated Data:', updatedData);

    const coupon = await Coupondb.couponCollection.findByIdAndUpdate(couponId, updatedData, { new: true });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon
    });
  } catch (error) {
    console.log("Error from editCoupon:", error);
    next(error);
  }
},


deleteCoupon : async (req,res,next) => {
  try {
    const deleteCoupon = await Coupondb.couponCollection.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } }
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    next(err);
  }
},


getSaleReport: async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';

    const matchStage = {};
    if (period === 'daily') {
      matchStage['orderDate'] = {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)), 
        $lt: new Date(new Date().setHours(24, 0, 0, 0)) 
      };
    } else if (period === 'monthly') {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
      matchStage['orderDate'] = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    } else if (period === 'yearly') {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const endOfYear = new Date(new Date().getFullYear() + 1, 0, 0, 23, 59, 59);
      matchStage['orderDate'] = {
        $gte: startOfYear,
        $lte: endOfYear
      };
    }
    const totalOrders = await Orderdb.orderCollection.countDocuments();
    const uniqueUserIds = await Orderdb.orderCollection.distinct('userId');
    const totalCustomers = uniqueUserIds.length;
    const onlinePayments = await Orderdb.orderCollection.countDocuments({ paymentMethod: 'Razorpay' });
    const cashOnDelivery = await Orderdb.orderCollection.countDocuments({ paymentMethod: 'COD' });
    const cancelledOrders = await Orderdb.orderCollection.countDocuments({ orderStatus: 'Cancelled' });
    const totalSales = await Orderdb.orderCollection.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
    ]);
    const totalCouponsUsed = await Coupondb.couponCollection.aggregate([
      { $group: { _id: null, couponsUsed: { $sum: "$couponsUsed" } } }
    ]);
    const totalRefundedAmount = await Wallectdb.walletCollection.aggregate([
      { $unwind: "$history" },
      {
        $match: {
          "history.transactionType": "Refunded"
        }
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: "$history.amount" }
        }
      },
      {
        $project: {
          _id: 0,
          totalRefunded: 1
        }
      }
    ]);

    const refundSum = totalRefundedAmount[0]?.totalRefunded || 0;
    const orders = await Orderdb.orderCollection.find();

    const productIds = orders.flatMap(order => order.orderItems.map(item => item.productId));
    const products = await Productdb.productCollection.find({ _id: { $in: productIds } }).select('originalprice discount');
    console.log(products, "this is from sales report");

    const orderDetails = orders.map(order => {
      return order.orderItems.map(item => {
        const product = products.find(p => p._id.equals(item.productId));
        const originalPrice = product ? product.originalprice : 0;
        const discount = product ? product.discount : 100;
        const discountPrice = Math.floor(originalPrice * discount / 100);
        const soldPrice = Math.floor(originalPrice-discountPrice);

        console.log(discount,"<<<<<<<<<<");
        console.log(originalPrice,">>>>>>>>>");
        return {
          fullName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          orderId: order._id,
          date: new Date(order.orderDate).toLocaleDateString(),
          productName: item.name,
          originalPrice: originalPrice,
          soldPrice: soldPrice,
          offer: order.offer || 'N/A',
          discount: discount,
          couponApplied: item.appliedCoupon || 'None',
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
        };
      });
    }).flat();
      
    res.render('admin/sales', {
      totalOrders,
      totalCustomers,
      totalRefundedAmount: refundSum,
      onlinePayments,
      cashOnDelivery,
      cancelledOrders,
      totalSales: totalSales[0]?.totalAmount || 0,
      totalCouponsUsed: totalCouponsUsed[0]?.couponsUsed || 0,
      orderDetails,
      period
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).send('Internal Server Error');
  }
},


downlordSalesReport: async (req, res, next) => {
  try {
    const todayDate = new Date();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Use the correct URL to generate the PDF
    await page.goto(`https://nandhu.live/admin/sales`, {
      waitUntil: 'networkidle2',
    });

    // Hide unnecessary UI elements
    await page.evaluate(() => {
      const downlordBtn = document.getElementById('download-btn');
      if (downlordBtn) {
        downlordBtn.style.display = 'none';
      }
      const searchBar = document.querySelector('.dataTables_filter');
      if (searchBar) {
        searchBar.style.display = 'none';
      }
      const pagination = document.querySelector('.dataTables_paginate');
      if (pagination) {
        pagination.style.display = 'none';
      }
      const showEntries = document.querySelector('.dataTables_length');
      if (showEntries) {
        showEntries.style.display = 'none';
      }
    });

    // Set viewport and generate PDF
    await page.setViewport({ width: 1920, height: 1080 });
    const pdfPath = path.join(__dirname, '../public/files', `${todayDate.getTime()}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
    });

    await browser.close();

    // Send the generated PDF file
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': fs.statSync(pdfPath).size,
    });
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        next(err);
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    next(error);
  }
},




dashboard: async (req, res, next) => {
  try {
    const timeframe = req.query.timeframe || 'monthly';
    const data = await fetchOrderData(timeframe);
    res.status(200).render("admin/dashboard", {
      data,
      timeframe
    });
  } catch (error) {
    console.log('Error fetching dashboard data:', error);
    next(error);
  }
}


}