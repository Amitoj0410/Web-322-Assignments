const posts = require("./data/posts.json");
const stripJs = require("strip-js");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const categories = require("./data/categories.json");
const blogData = require("./blog-service");
const path = require("path");
const express = require("express");
const exphbs = require("express-handlebars");
const app = express();
const PORT = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: "dyxegadrc",
  api_key: "638954724841219",
  api_secret: "ovdWTvISmMmtMi-yqVg7unekDx8",
  secure: true,
});

const upload = multer();

// const hbs = exphbs.create({
//   extname: ".hbs",
//   helpers: {
//     navLink: function (url, options) {
//       return (
//         "<li" +
//         (url == app.locals.activeRoute ? ' class="active" ' : "") +
//         '><a href="' +
//         url +
//         '">' +
//         options.fn(this) +
//         "</a></li>"
//       );
//     },
//   },
// });

app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper 'equal' needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

app.use(express.static("public"));

// ? Interesting middleware to understand
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});
// ? Interesting middleware to understand

app.get("/", (req, res) => {
  //res.send("helloo your welcome");
  res.redirect("/blog");
});

app.get("/about", (req, res) => {
  // res.sendFile(path.join(__dirname, "views", "about.html"));
  res.render("about");
  // res.render(path.join(__dirname, "views", "about.hbs"));
});

// app.get("/blog", (req, res) => {
//   blogData
//     .getPublishedPosts()
//     .then((data) => {
//       res.json(data);
//     })
//     .catch((err) => {
//       res.status(500).send(err);
//     });
// });
app.get("/blog", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

app.get("/posts", (req, res) => {
  const category = Number(req.query.category);
  const minDateStr = req.query.minDate;

  if (category) {
    blogData
      .getPostsByCategory(category)
      .then((data) => {
        // res.json(data);
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        // res.status(500).send("Error retreiving posts by category:- " + err);
        res.render("posts", { message: "no results for this category" });
      });
  } else if (minDateStr) {
    blogData
      .getPostsByMinDate(minDateStr)
      .then((data) => {
        // res.json(data);
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        // res.status(500).send("Error retreiving posts by min date:- " + err);
        res.render("posts", {
          message: "error retreiving posts by this min date",
        });
      });
  } else {
    blogData
      .getAllPosts()
      .then((data) => {
        // res.json(data);
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        // res.status(500).send("Error retreiving all posts:- " + err);
        res.render("posts", { message: "error retreiving all posts" });
      });
  }
});

app.get("/categories", (req, res) => {
  blogData
    .getCategories()
    .then((data) => {
      // res.json(data);
      res.render("categories", { categories: data });
    })
    .catch((err) => {
      // res.status(500).send("the promise was rejected" + err);
      res.render("categories", { message: "no results" });
    });
});

app.get("/posts/add", (req, res) => {
  // res.sendFile(path.join(__dirname, "/views/addPost.html"));
  res.render("addPost");
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  console.log("Request Body:", req.body);
  console.log("Uploaded File:", req.file);
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  }

  upload(req)
    .then((uploaded) => {
      req.body.featureImage = uploaded.url;

      // Create a new post object using the data from the form submission
      let newPost = {
        title: req.body.title,
        body: req.body.body,
        featureImage: req.body.featureImage,
        category: Number(req.body.category),
        published: req.body.published, // Converts "true" or "false" string to a boolean
        // Add other fields from req.body as needed
      };

      // console.log(newPost);

      // Call the function to add the new post to your storage or database
      return blogData.addPost(newPost);
    })
    .then((postData) => {
      // Redirect to /posts after successfully adding the new post
      // res.status(200).json(postData);
      res.redirect("/posts");
    })
    .catch((err) => {
      console.error("Error adding new post:", err);
      res.status(500).send("Error adding new post: " + err);
    });
});

// ! Keep the param routes(eg. /posts/:value) at the end to avoid conflicts with other routes
app.get("/posts/:value", (req, res) => {
  const id = req.params["value"];
  blogData
    .getPostById(Number(id))
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.status(500).send("Error retreiving post for this id:- " + err);
    });
});

app.get("/blog/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogData.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  console.log(viewData.post);
  res.render("blog", { data: viewData });
});
// ! Keep the params route at the end to avoid conflicts with other routes

app.use((req, res) => {
  // res.status(404).send("Alas! page not Found :(");
  res.render("404");
});

blogData
  .initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log("server running on " + PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize blog data", err);
  });
