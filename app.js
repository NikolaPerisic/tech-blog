const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const expressSanitizer = require("express-sanitizer");
const mongoose = require("mongoose");

const app = express();

// APP config
mongoose.connect("mongodb://localhost:27017/restful_blog_app", {
    useNewUrlParser: true
});
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

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
app.get("/blogs/new", (req, res) => {
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
app.get("/blogs/:id", function(req, res) {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("show", { blog: foundBlog });
        }
    });
});

// EDIT Route
app.get("/blogs/:id/edit", (req, res) => {
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
app.delete("/blogs/:id", (req, res) => {
    Blog.findById(req.params.id, (err, blog) => {
        if (err) {
            console.log(err);
        } else {
            blog.remove();
            res.redirect("/blogs");
        }
    });
});

app.listen(5000, () => {
    console.log("Blog App server running!");
});
