const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const session = require('express-session');
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
const flash = require('connect-flash');
app.listen("3000", () => {
    console.log("App is listening...")
});
app.get("/", (req, res) => {
    res.send("Home route");
});

// app.get("/cookies", (req, res) => {
//     res.cookie("made in:", "India");
//     res.send("Cookie saved");
// });
// app.use(cookieParser("secretcode"));
// app.get("/getcookies", (req, res) => {
//     console.dir(req.cookies);
//     res.send("cookies found");
// });


// app.get("/signedcookies", (req, res) => {
//     res.cookie("made in:", "china", { signed: true });
//     res.send("sent a signed cookie");
//     console.dir(req.signedCookies);
// });
const sessionoptions = { secret: "mysecretstring", resave: false, saveUninitialized: true };
app.use(session(sessionoptions));
app.get("/test", (req, res) => {
    res.send("test passed!");
});
app.use(flash());
app.use((req, res, next) => {
    res.locals.successMsg = req.flash("success");
    res.locals.failMsg = req.flash("fail");
    next();
});
// app.get("/getcount", (req, res) => {
//     if (req.session.count) {
//         req.session.count++;
//     } else {
//         req.session.count = 1;
//     }
//     res.send(`You send the request ${req.session.count} times`);
// });
app.get("/register", (req, res) => {
    let { name = "anonymous" } = req.query;
    req.session.name = name;
    if (name === "anonymous") {
        req.flash("fail", "user not registered!!!");
    } else {
        req.flash("success", "user registered successfully!");   
    }
    res.redirect("/hello");
});
app.get("/hello", (req, res) => {
    res.render("page.ejs", { name: req.session.name});
});