if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const { listingSchema , reviewSchema } = require("./schema.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const Review = require("./models/review.js");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const Localstrategy = require('passport-local');
const User = require("./models/user.js");
const { isLoggedin, redirectUrl,isOwner, isreviewAuthor } = require("./middleware.js");
const { saveredirectUrl } = require("./middleware.js");
const ListingController = require("./controllers/listings.js");
const ReviewController = require("./controllers/reviews.js");
const UserController = require("./controllers/user.js");
const { storage } = require("./cloudConfig.js");
const multer = require('multer');
const upload = multer({ storage });
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine("ejs", ejsMate);
const dburl = process.env.MONGODBURL;
main().then((res) => {
    console.log("connection successful");
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(dburl);
}
// app.get("/", (req,res) => {
//     res.send("I am root");
// });
app.listen(8080, () => {
    console.log("App is listening at port");
});
const store = MongoStore.create({
    mongoUrl: dburl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});
store.on("error", () => {
    console.log("Some error in mongostore", err);
});
const sessionoptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly:true,
    }
};

app.use(session(sessionoptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// app.get("/testlisting", async (req, res) => {
//     let samplelisting = new Listing({
//         title: "My first Villa",
//         description: "kapils villa",
//         price: 1000,
//         location: "Haryana",
//         country: "India"
//     });

//     await samplelisting.save();
//     console.log("Successful");
//     res.send("added");
// });
const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    console.log(error);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(404, errMsg);
    }
    next();
};
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(404, errMsg);
    }
    next();
};
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});
//show all listings
app.get("/listings",upload.single('listing[image]'),wrapAsync(ListingController.renderAllListings));


app.get("/listings/new",isLoggedin, (req, res) => {
    res.render("listings/form.ejs");
});


//show a particular listing
app.get("/listings/:id", wrapAsync(ListingController.renderListing));

// new listing
app.post("/listings", isLoggedin,upload.single('listing[image]'), wrapAsync(ListingController.renderNewForm));


//edit listings
app.get("/listings/:id/edit", isLoggedin, isOwner, wrapAsync(ListingController.renderEditForm));

//update Listing
app.put("/listings/:id", isLoggedin, isOwner,upload.single('listing[image]'), wrapAsync(ListingController.renderUpdateListing));

//Delete Listing
app.delete("/listings/:id", isLoggedin, isOwner, wrapAsync(ListingController.renderDeleteListing));

//search request
app.get("/search", wrapAsync(async (req, res) => {
    let { listingname } = req.query; 
        const listings = await Listing.find({ title: listingname });
        if (listings.length > 0) {
            const listing = listings[0];
            res.render("listings/show.ejs", { listing });
        } else {
            req.flash("error", "No Such Listing Found");
            res.redirect("/listings");
        }
}));


//reviews
app.post("/listings/:id/reviews",isLoggedin,validateReview, wrapAsync(ReviewController.addReview));
//delete reveiws
app.delete("/listings/:id/reviews/:reviewId", isLoggedin, isreviewAuthor, wrapAsync(ReviewController.deleteReview));


//Signup Form
app.get("/signup",UserController.signup);
//post form
app.post("/signup", wrapAsync(UserController.signupForm));
//login
app.get("/login", UserController.login);
//login form
app.post("/login",saveredirectUrl, passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
    }),UserController.loginForm );
//logout route
app.get("/logout", UserController.logout);

//Error Handler middlewares..
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});
app.use((err, req, res, next) => {
    let { statusCode = 404, message = "something went wroung" } = err;
    res.render("error.ejs", { message });
});