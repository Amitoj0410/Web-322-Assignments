require("dotenv").config();
const mongoose = require("mongoose");

let Schema = mongoose.Schema;

let userSchema = new Schema({
  firstName: String,
  lastName: String,
  userName: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User;

function initialize() {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB_CONNECTION_STRING);
    db.on("error", (err) => {
      reject(err);
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve("MongoDB database synchronized");
    });
  });
}

function registerUser(userData) {
  //todo add bcrypt to hash password
  return new Promise((resolve, reject) => {
    const {
      email,
      password,
      password2,
      userName,
      userAgent,
      firstName,
      lastName,
    } = userData;

    User.findOne({
      $or: [{ email: email }, { userName: userName }],
    })
      .exec()
      .then((user) => {
        if (user) {
          reject("User with this email or username already exists");
        } else {
          // If no user exists, proceed with password check
          if (password !== password2) {
            reject("Password Doesnt Match");
          } else {
            //if password matches, proceed with user registraction
            let newUser = new User({
              email,
              password,
              userName,
              userAgent,
              firstName,
              lastName,
            });

            newUser
              .save()
              .then((data) => {
                resolve(data);
              })
              .catch((err) => {
                reject("Error saving user: " + err);
              });
          }
        }
      })
      .catch((err) => {
        reject("Error checking user existance:- " + err);
      });
  });
}

function checkUser(userData) {
  return new Promise((resolve, reject) => {
    const { emailOrUserName, password, userAgent } = userData;
    User.findOne({
      $or: [{ email: emailOrUserName, userName: emailOrUserName }],
    })
      .exec()
      .then((user) => {
        if (!user) {
          reject("User not found");
        } else {
          //user exists, check password
          if (user.password !== password) {
            reject("Incorrect password entered");
          } else {
            //password matches
            user.loginHistory.push({
              dateTime: new Date().toString(),
              userAgent: userAgent,
            });
            User.updateOne(
              { userName: user.userName }, // Query criteria
              { $set: { loginHistory: user.loginHistory } } // Update operation
            )
              .exec()
              .then(() => {
                resolve(user);
              })
              .catch((err) => {
                reject("Error updating user login history: " + err);
              });
          }
        }
      })
      .catch((err) => {
        reject("Error finding user: " + err);
      });
  });
}

module.exports = {
  initialize,
  registerUser,
  checkUser,
};
