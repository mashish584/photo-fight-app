const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
mongoose.Promise = global.Promise;

let UserSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: "Fullname is required"
        },
        email: {
            type: String,
            unique: true,
            required: "Email is required"
        },
        password: {
            type: String,
            required: "Password is required"
        },
        role: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

UserSchema.virtual("gallery", {
    ref: "Gallery",
    localField: "_id",
    foreignField: "user"
});

UserSchema.pre("findOne", function() {
    this.populate("gallery");
});

UserSchema.pre("save", function(next) {
    let user = this;
    user.password = bcrypt.hashSync(user.password, 15);
    next();
});

module.exports = mongoose.model("User", UserSchema);
