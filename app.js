const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const expressSanitizer = require("express-sanitizer");
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategy = require("passport-local");
const pasportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/user");

const app = express();

// APP CONFIG
mongoose.connect("mongodb://localhost:27017/restful_blog_app", {
    useNewUrlParser: true
});

// SESSION SETUP
app.use(
    require("express-session")({
        secret: "bukizer meowzer",
        resave: false,
        saveUninitialized: false
    })
);

// APP CONFIG

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Pass if user is auth to the template
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

// Mongoose model config
const blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: { type: Date, default: Date.now }
});

const Blog = mongoose.model("Blog", blogSchema);

// RESTful Routes

app.get("/", (req, res) => {
    res.redirect("/blogs");
});

// INDEX Route
app.get("/blogs", (req, res) => {
    Blog.find({}, (err, blogs) => {
        if (err) {
            console.log("Error!!!");
        } else {
            res.render("index", { blogs });
        }
    });
});

//NEW Route
app.get("/blogs/new", isLoggedIn, (req, res) => {
    res.render("new");
});

//CREATE Route
app.post("/blogs", (req, res) => {
    //sanitize input
    req.body.blog.body = req.sanitize(req.body.blog.body);
    //create blog
    Blog.create(req.body.blog, (err, newBlog) => {
        if (err) {
            res.render("new");
        } else {
            //redirect to index
            res.redirect("/blogs");
        }
    });
});

//SHOW Route
app.get("/blogs/:id", (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("show", { blog: foundBlog });
        }
    });
});

// EDIT Route
app.get("/blogs/:id/edit", isLoggedIn, (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("edit", { blog: foundBlog });
        }
    });
});

//UPDATE Route
app.put("/blogs/:id", (req, res) => {
    //sanitize input
    req.body.blog.body = req.sanitize(req.body.blog.body);

    Blog.findByIdAndUpdate(req.params.id, req.body.blog, (err, updatedBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

//DELETE Route
app.delete("/blogs/:id", isLoggedIn, (req, res) => {
    Blog.findById(req.params.id, (err, blog) => {
        if (err) {
            console.log(err);
        } else {
            blog.remove();
            res.redirect("/blogs");
        }
    });
});

// AUTH ROUTES

// CHECK IF USER IS LOGGED IN
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

// USER LOGIN
app.get("/login", (req, res) => {
    res.render("login");
});

// LOGIN LOGIC
app.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        successRedirect: "/blogs"
    }),
    (req, res) => {
        res.render("/blogs");
    }
);

//LOGOUT
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

//REGISTER

// SHOW SIGN UP FORM
app.get("/register", (req, res) => {
    res.render("register");
});

// USER REGISTRATION
app.post("/register", (req, res) => {
    User.register(
        new User({ username: req.body.username }),
        req.body.password,
        (err, user) => {
            if (err) {
                console.log(err);
                res.render("register");
            }
            passport.authenticate("local")(req, res, () => {
                res.redirect("blogs");
            });
        }
    );
});

app.listen(5000, () => {
    console.log("Blog App server running!");
});
