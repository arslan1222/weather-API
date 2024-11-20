const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post("/signup", wrapAsync(async (req, res) => {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    
    try {
        const registeredUser = await User.register(newUser, password);
        req.flash("success", "Sign Up successfully!");
        res.redirect("/home");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/signup");
    }
}));

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.post("/login", passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
}), (req, res) => {
    res.redirect("/home");
});


router.get("/logout", (req, res, next)=>{
    req.logout((err)=>{
        if(err){
           return next(err);
        }
        req.flash("success", "Login!");
        res.redirect("/login");
    })
});


module.exports = router;
