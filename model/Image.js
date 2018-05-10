const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

let ImageSchema = new mongoose.Schema({
    image: {
        type: String,
        required: "Upload image please"
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    votes: [mongoose.Schema.ObjectId],
    inCompetetion: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now()
    }
});

function populate() {
    this.populate("user", "-password -createdAt -role");
}

ImageSchema.pre("find", populate);
ImageSchema.pre("findOneAndUpdate", populate);

module.exports = mongoose.model("Gallery", ImageSchema);
