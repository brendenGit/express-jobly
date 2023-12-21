"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseConfig } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client(getDatabaseConfig());
} else {
  db = new Client(getDatabaseConfig());
};

db.connect();

module.exports = db;