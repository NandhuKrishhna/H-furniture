const Userdb = require("../models/UserModels");
const Productdb = require("../models/productModels");
const jwt = require("jsonwebtoken");
const Catergorydb = require("../models/categoryModel");


const searchProducts = async (searchTerm) => {
    const escapedTerm = escapeRegExp(searchTerm);

    const query = [
      {
        $lookup: {
          from: "catogory_datas",
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
            { productName: { $regex: new RegExp(escapedTerm, "i") } },
          ],
        },
      },
    ];

    try {
      const result = await Productdb.productCollection.aggregate(query);

      return result;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  };

  module.exports = { searchProducts }