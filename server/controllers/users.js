/* GITCONNECT SERVER 
    FILE: USERS API handeler 
    AUTHOR: Jericho Sharman   
    DATE: 05/2022   
    DESCRIPTION:*/
// ********************************************************************************************************************
// SET UP THE INCLUDES
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db/db.js");
const router = express.Router();
const USERS_TABLE_NAME = "users";

// ********************************************************************************************************************
// CREATE THE ROUTER
router.post(`/register`, (req, res) => {
  // REGISTER A NEW USER
  if (!req.body.name || !req.body.email || !req.body.password) {
    // Ensure data is present
    res.status(400).json({ status: false, message: "Missing information" });
    return;
  }
  if (req.body.password != req.body.confirmPassword) {
    // Confirm passwords match
    res.status(400).json({ status: false, message: "Password do not match" });
    return;
  }
  if (
    // Validate password and name lengths
    req.body.name.length > 20 ||
    req.body.email.length > 100 ||
    req.body.password.length > 20 ||
    req.body.password.length < 4
  ) {
    res
      .status(400)
      .json({ status: false, message: "Incorrect password length" });
    return;
  }
 
  const hash = createHash(req.body.email, req.body.password, 5); // create the hashed password from password and email.
  //  Register the new user. Add them to the user database
  console.log(req.body)

  db.query(
    `INSERT INTO users (githubName,userType,profiletype,email,firstName) VALUES ($1,$2,$3,$4,$5);`,
    [req.body.githubName, req.body.userType, req.body.profiletype, req.body.email, req.body.name]
  )
    .then((dbres) => {
      // console.log("*****************",dbres);
      // Retrieve the recently added user ID
      db.query(`SELECT id FROM users WHERE email = $1;`, [req.body.email]).then((dbres) => {
        db.query(
          `INSERT INTO hashed_passwords (id,hashed_password) VALUES ($1,$2);`,
          [dbres.rows[0].id, hash] // insert the new user id and hashed password into password table
        ).then((dbresults) => {
          res.json({ status: true, message: "New user added" });
        });
      });
    })
    .catch((reason) => {
      console.log("ERROR ---> ", reason);
      res.status(400).json({ message: reason.detail });
    });
});

router.get(`/getUsers`, (req, res) => {
  // TODO: REmove this so random people cannot view all the users in the database.
  ret = dbSelectQuery(`SELECT * FROM users;`, res);
  // res.json(ret)
});

// ********************************************************************************************************************
// INTERNAL FUNCTIONS
function createHash(email, password) {
  return bcrypt.hashSync(password + email.toUpperCase(), 10, null);
}

// recommend using this for simplicity
function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}


function isValidPassword(plainTextPassword, passwordHash) {
  // Returns true or false
  return bcrypt.compareSync(plainTextPassword, passwordHash)
}

function dbSelectQuery(theQuery, res) {
  //  Function to execute SQL code in the database
  result = db
    .query(theQuery)
    .then((dbResults) => {
      res.json(dbResults.rows);
    })
    .catch((reason) => {
      console.log("INTERNAL DATABASE ERROR", reason);
      res.status(500).json({ message: "Cannot find data" });
    });
  return result;
}

module.exports = router;
