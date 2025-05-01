const mongoose = require("mongoose");
const { thirtyDaysFromNow } = require("../utils/dates");

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_data",
        index: true,
        required: true,
    },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, default: thirtyDaysFromNow },
});

const sessionCollection = mongoose.model("Session", sessionSchema);
module.exports = { sessionCollection };
