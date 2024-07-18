
const Admindb = require("../models/adminModels");
const Userdb = require("../models/UserModels");
const Productdb = require("../models/productModels");
const Categorydb = require("../models/categoryModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb")
const fs = require("fs");
const path = require("path");
const {handleError, } = require("../utils/errorhandling");




// Get login page
const getAdminLogin = async (req, res, next) => {
  try {
    if (req.cookies.adminToken) {
      const token = req.cookies.adminToken;
      console.log("Token:", token);
      try {
        const admin = jwt.verify(token, process.env.ADMIN_SECRET);
        console.log("Admin:", admin);
        if (admin) {
          return res.redirect("/admin/user_panel",);
        } else {
          return res.status(200).render("admin/login", {admin: true});
        }
      } catch (err) {
        console.log("Token verification failed:", err);
        return res.status(200).render("admin/login", {admin: true});
      }
    } else {
      console.log("No token found, rendering login page");
      return res.status(200).render("admin/login", {admin: true});
    }
  } catch (error) {
    console.log("Error in getAdminLogin:", error);
    return res.status(500).send("Internal Server Error");
  }
};

// Verify admin login

const verifyAdminLogin = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);

  if (!email || !password) {
    const errors = handleError({ message: "empty fields" });
    return res.status(400).render("admin/login", { errors, admin: false });
  }

  try {
    const admin = await Admindb.adminCollection.findOne({ email: req.body.email });

    if (!admin) {
      const errors = handleError({ message: "incorrect email" });
      return res.status(404).render("admin/login", { errors, admin: false });
    }

    const passwordValid = await bcrypt.compare(req.body.password, admin.password);

    if (!passwordValid) {
      const errors = handleError({ message: "incorrect password" });
      return res.status(404).render("admin/login", { errors, admin: false });
    }

    const { _id } = admin;
    if (passwordValid) {
      const adminToken = jwt.sign({ _id }, process.env.ADMIN_SECRET);
      res.cookie("adminToken", adminToken, { httpOnly: true });
      console.log("Hi, admin entered the admin panel");
      return res.redirect("/admin/user_panel" );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};


const userManagement = async (req, res, next) => {
  try {
      const users = await Userdb.userCollection.find({}).lean();
      const userData = convertDate(users);

      res.status(200).render("admin/user_panel", {
          adminUser: true,
          users: users, 
          userData: userData
      });
  } catch (error) {
      next(error);
  }
};



// to convert data to a readable format

function convertDate(users){
  users.forEach(element => {
    element.createdAt = new Date(element.createdAt).toLocaleString()
    element.updatedAt = new Date(element.updatedAt).toLocaleString()
  });
  return users;
}

const blockUser = async (req, res, next) => {
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

const unblockUser = async (req, res, next) => {
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
const getCategory = async (req, res, next) => {
  try {
    const category = await Categorydb.categoryCollection
      .find({ isDeleted: false })
      .lean();
   const categoryData = convertDate(category)
    res.status(200).render("admin/admin-category", {
      adminUser: true,
      category: true,
      category,
      categoryData
    });
  } catch (er) {
    next(er);
  }
};

// getting Add catergory Page
const getAddCategory = (req, res, next) => {
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
const addCategory = async (req, res, next) => {
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
      console.log("this is the category data:" + JSON.stringify(data));

      const addCategory = await Categorydb.categoryCollection.insertMany(data);
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
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
const getEditcategory = async (req, res, next) => {
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



const editCategory = async (req, res, next) => {
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
//getting admin add product
const getAdminProduct = async (req, res, next) => {
  try {
    const products = await Productdb.productCollection.aggregate([
      { $match: { isDeleted: false } },
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
const adminaddProduct = async (req, res, next) => {
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
const addProduct = async (req, res, next) => {
  console.log("Request Body:", req.body);
  console.log("Request Files:", req.files);

 

  try {
    

    const category = await Categorydb.categoryCollection.findOne({
      categoryName: { $regex: req.body.category, $options: "i" }
    });

  
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
      images: req.files.map((file) => file.path),
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
const getEditProduct = async (req, res, next) => {
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
  } catch (err) {
    console.log(err);
    next(err); 
};

}


// admin editing products
const editProduct = async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.files);
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
      const newImages = req.files.map((file) => file.filename);
      for (const image of updateProduct.images) {
        const imagePath = path.join('uploads', image);
        await fs.unlink(imagePath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
      await Productdb.productCollection.findOneAndUpdate(
        { _id: id },
        { $set: { images: newImages } },
        { returnDocument: 'after' }
      );
    }
    if (req.body.category) {
      if (req.body.category !== product[0].category.categoryName) {
        const category = await Categorydb.categoryCollection.findOne({
          categoryName: { $regex: req.body.category, $options: 'i' },
        });
        const updateProduct =
          await Productdb.productCollection.findOneAndUpdate(
            { _id: id },
            {
              $set: {
                category: category._id,
              },
            },
            { returnDocument: 'after' }
          );
      }
    }
    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
    next(err);
  }
};





const deleteProduct = async (req, res, next) => {
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


const adminLogout = async (req, res, next) => {
  try {
    res.clearCookie("adminToken");
    res.redirect("/admin/login");
  } catch (error) {
    next(error);
  }
}

const sample =  async (req, res, next) => {
  res.render("user/sample")
}
module.exports = {
  
  getAdminLogin,
  verifyAdminLogin, 
  userManagement,
  blockUser, 
  unblockUser,
  getCategory,
  getAddCategory,
  addCategory,
  deleteCategory,
  editCategory,
  getEditcategory,
  getAdminProduct,   
  addProduct,
  adminaddProduct,
  adminLogout,
  deleteProduct,
  editProduct,
  getEditProduct
 , sample
   }