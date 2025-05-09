const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  logoUrl: { 
    type: String 
  },
  description: { 
    type: String 
  },
  establishedYear: { 
    type: Number 
  },
  country: { 
    type: String 
  },
  // Add any additional fields as needed
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const brandCollection = mongoose.model('brand_data', brandSchema);

module.exports = { brandCollection };
