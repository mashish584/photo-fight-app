const mongoose = require("mongoose");
const User = mongoose.model("User");
const bcrypt = require("bcrypt");

/*
    >=> GET CONTROLLERS
*/

exports.getSignIn = (req, res, next) => {
    res.render("signin", { title: "SignIn" });
};

exports.getSignUp = (req, res, next) => {
    res.render("signup", { title: "SignUp" });
};

/*
    >=> POST CONTROLLERS
*/

exports.register = async (req, res, next) => {
    let user = await new User(req.body).save();
    req.flash("success", "Account Created");
    return res.redirect("/signin");
};

exports.auth = async (req, res, next) => {
    const { email, password } = req.body;

    //find user with email if exist compare password
    // else throug a error message
    let user = await User.findOne({ email: email });
    if (user && bcrypt.compareSync(password, user.password)) {
        // store user object and it's id
        // in seperate session properties
        req.session.userId = user._id;
        req.session.user = user;
        return res.redirect("/home");
    } else {
        req.flash("error", "Credentials not matched.");
        return res.redirect("/signin");
    }
};

exports.signOut = async (req, res, next) => {
    delete req.session.user;
    delete req.session.userId;
    return res.redirect("/home");
};
