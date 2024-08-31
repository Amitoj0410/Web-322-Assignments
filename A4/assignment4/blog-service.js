const fs = require("fs");
const { resolve } = require("path");
//const { getEnabledCategories } = require("trace_events");
let posts = [];
let categories = [];
function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile("data/posts.json", "utf8", (err, data) => {
      if (err) {
        reject("unable to read data from posts.json");
        return;
      }
      posts = JSON.parse(data);
      fs.readFile("data/categories.json", "utf8", (err, data) => {
        if (err) {
          reject("unable to fetch data from categories.json");
          return;
        }
        categories = JSON.parse(data);
        resolve();
      });
    });
  });
}
function getAllPosts() {
  return new Promise((resolve, reject) => {
    if (posts.length === 0) {
      reject("heyy no results returned");
      return;
    }
    resolve(posts);
  });
}
function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    var PublishedPosts = [];
    PublishedPosts = posts.filter((post) => post.published);
    if (PublishedPosts.length === 0) {
      reject("no posts with published value true");
    } else {
      resolve(PublishedPosts);
    }
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject("no data was observed in categories.json");
    } else resolve(categories);
  });
}

function addPost(postData) {
  return new Promise((resolve, reject) => {
    if (postData.published === undefined) {
      postData.published = false;
    } else postData.published = true;

    postData.id = posts.length + 1;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Months are zero-indexed
    const day = today.getDate();
    postData.postDate = `${year}-${month}-${day}`;

    posts.push(postData);
    // posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate)); // ? // Optionally sort posts by postDate to ensure the newest posts are first
    resolve(postData);
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    const specificPosts = posts.filter(
      (singlePost) => singlePost.category === category
    );
    if (specificPosts.length === 0) {
      reject(new Error("No posts found for this category"));
    } else {
      resolve(specificPosts);
    }
  });
}

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const date1 = new Date(minDateStr);

    if (isNaN(date1.getTime())) {
      return reject(new Error("Invalid date format"));
    }

    const specificPosts = posts.filter(
      (singlePost) => new Date(singlePost.postDate) >= date1
    );

    if (specificPosts.length === 0) {
      reject(new Error("No posts found for this min date"));
    } else {
      resolve(specificPosts);
    }
  });
}

function getPostById(id) {
  // console.log(id);
  return new Promise((resolve, reject) => {
    const specificPost = posts.find(
      (singlePost) => singlePost.id === Number(id)
    );
    if (specificPost) {
      resolve(specificPost);
    } else {
      reject(new Error("No post found for this id"));
    }
  });
}

function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    var PublishedPostsByCategory = [];
    PublishedPostsByCategory = posts.filter(
      (post) => post.published == true && post.category == category
    );
    if (PublishedPostsByCategory.length === 0) {
      reject("no posts with published value true && category provided matches");
    } else {
      resolve(PublishedPostsByCategory);
    }
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
};
