const Listing = require("../models/listing");
const User = require("../models/user");

module.exports.signup = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signupForm = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const result = await User.register(newUser, password);
        req.login(result, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.login = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.loginForm = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You logged out successfully!");
        res.redirect("/listings");
    });
};