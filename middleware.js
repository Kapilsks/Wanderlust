const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
module.exports.isLoggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // Save the current URL to redirect after login
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to make some changes!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveredirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = (async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of this listing!");
        res.redirect(`/listings/${id}`);
    }
    next();
});
module.exports.isreviewAuthor = (async (req, res, next) => {
    let { id,reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of this review!");
        res.redirect(`/listings/${id}`);
        return;
    }
    next();
});