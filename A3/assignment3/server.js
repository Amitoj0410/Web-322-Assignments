const posts = require("./data/posts.json");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const categories = require("./data/categories.json");
const blogService = require("./blog-service");
const path = require("path");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: "dyxegadrc",
  api_key: "638954724841219",
  api_secret: "ovdWTvISmMmtMi-yqVg7unekDx8",
  secure: true,
});

const upload = multer();

app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

app.use(express.static("public"));

app.get("/", (req, res) => {
  //res.send("helloo your welcome");
  res.redirect("/about");
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});

app.get("/blog", (req, res) => {
  blogService
    .getPublishedPosts()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
  // var container = [];
  //posts.forEach((singlePost, i) => {
  //  if (singlePost.published === true) {
  //    container.push(singlePost);
  // }
  // });
  // res.json(container);
});

app.get("/posts", (req, res) => {
  const category = Number(req.query.category);
  const minDateStr = req.query.minDate;

  if (category) {
    blogService
      .getPostsByCategory(category)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.status(500).send("Error retreiving posts by category:- " + err);
      });
  } else if (minDateStr) {
    blogService
      .getPostsByMinDate(minDateStr)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.status(500).send("Error retreiving posts by min date:- " + err);
      });
  } else {
    blogService
      .getAllPosts()
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.status(500).send("Error retreiving all posts:- " + err);
      });
  }
});

app.get("/posts/:value", (req, res) => {
  const id = req.params["value"];
  blogService
    .getPostById(Number(id))
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.status(500).send("Error retreiving post for this id:- " + err);
    });
});

app.get("/categories", (req, res) => {
  blogService
    .getCategories()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.status(500).send("the promise was rejected" + err);
    });
});

app.get("/posts/add", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/addPost.html"));
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
      return blogService.addPost(newPost);
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

app.use((req, res) => {
  res.status(404).send("Alas! page not Found :(");
});

blogService
  .initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log("server running on " + PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize blog data", err);
  });
