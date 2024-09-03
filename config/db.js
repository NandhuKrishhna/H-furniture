const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const db = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {

        });
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed: ', error);
        process.exit(1);
    }
};

module.exports = db;
