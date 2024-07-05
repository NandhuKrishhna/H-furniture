const mongoose = require("mongoose");
const {isEmail}= require("validator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please enter your name"],
  },
  lastName: {
    type: String,
    required: [ true, "Please enter your last name"],
  },
  email: {
    type: String,
    required: [ true, "Please enter your email"], 
    unique: true,
    lowercase:true,
    validate:[isEmail,"Please enter a valid email"]
  },
  password: {
    type: String,
    required: [ true, "Please enter your password"],
    minlength:[ 6, "Password should be at least 6 characters"],
   
   }

  ,phone: {
    type: Number,
    required: [ true, "Please enter your phone number"],
    unique: true,
    minlength:[ 10, "Phone number should be at least 10 characters"],
  },
  isBlocked: {
    type: Boolean,
    default: false,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  tokens:[{
    token :{
      type:String,
      required:true
    }
  }]
});

userSchema.pre("save", async function (next){
    if(this.isModified("password"))
    this.password =  await bcrypt.hash(this.password,10)
  
    next()

} )

userSchema.statics.login = async function(email,password){
    const user = await this.findOne({email})
    if(user){
        const auth = await bcrypt.compare(password,user.password)
        if(auth){
          return user
        }
        throw Error("incorrect password")
    }
    throw Error("incorrect email")
}

// create a collection
const userCollection = new mongoose.model("User", userSchema)

module.exports = userCollection