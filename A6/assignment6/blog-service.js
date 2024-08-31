const Sequelize = require("sequelize");
const Op = Sequelize.Op;

var sequelize = new Sequelize("SenecaDB", "SenecaDB_owner", "FeMP0CDcbro7", {
  host: "ep-misty-river-a5yzxoqn.us-east-2.aws.neon.tech",
  dialect: "postgres",
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
  query: { raw: true },
});

const Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Post.belongsTo(Category, { foreignKey: "category" });

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve("Postgres database synchronized");
      })
      .catch((err) => {
        reject("unable to sync the database:- " + err);
      });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then((data) => {
        // console.log(`Data is : ${data}`);
        if (data.length > 0) {
          // console.log("in resolve");
          resolve(data);
        } else {
          // console.log("in reject - no posts found");
          reject("No posts found in the database.");
        }
      })
      .catch((err) => {
        // console.log("in catch");
        reject("error retrieving posts: " + err);
      });
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("no published posts found");
        }
      })
      .catch((err) => {
        reject("Error finding published posts :- " + err);
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => {
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("no categories found in the database");
        }
      })
      .catch((err) => {
        reject("Error retrieving categories :- " + err);
      });
  });
}

function addPost(postData) {
  console.log(typeof postData.category);
  return new Promise((resolve, reject) => {
    postData.published = postData.published ? true : false;

    for (const key in postData) {
      if (postData[key] === "") {
        postData[key] = null;
      }
    }

    // postData["postDate"] = new Date();
    postData.postDate = new Date();

    Post.create(postData)
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject("Error creating post :- " + err);
      });
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        category,
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("no posts found for the category provided");
        }
      })
      .catch((err) => {
        reject("error retrieving posts for his category:- " + err);
      });
  });
}

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: {
          [Op.gte]: new Date(minDateStr),
        },
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("no posts found by the min date provided");
        }
      })
      .catch((err) => {
        reject("error retrieving posts by min date provided:- " + err);
      });
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        id,
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data[0]); // ? in the data array there is only one post found so we just resolve with that single post object
        } else {
          reject("no post found for the id provided");
        }
      })
      .catch((err) => {
        reject("error retrieving post by the id provided:- " + err);
      });
  });
}

function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        [Op.and]: [{ published: true }, { category }],
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data);
        } else {
          reject("no published posts found for the category provided");
        }
      })
      .catch((err) => {
        reject("Error retrieving published posts by category :- " + err);
      });
  });
}

function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    for (const key in categoryData) {
      if (categoryData[key] === "") {
        categoryData[key] = null;
      }
    }

    Category.create(categoryData)
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject("Error creating category:- " + err);
      });
  });
}

function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: {
        id,
      },
    })
      .then((deletedCount) => {
        if (deletedCount > 0) {
          resolve(`Category with id - ${id} was deleted successfully.`);
        } else {
          reject(`No category found with id ${id}.`);
        }
      })
      .catch((err) => {
        reject(`Error deleting category with id ${id}: ${err}`);
      });
  });
}

function deletePostById(id) {
  return new Promise((resolve, reject) => {
    Post.destroy({
      where: {
        id,
      },
    })
      .then((deletedCount) => {
        if (deletedCount > 0) {
          resolve(`Post with id - ${id} was deleted successfully.`);
        } else {
          reject(`No post found with id ${id}.`);
        }
      })
      .catch((err) => {
        reject(`Error deleting post with id ${id}: ${err}`);
      });
  });
}

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
  getPublishedPostsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
};
