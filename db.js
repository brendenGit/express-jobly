"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseConfig } = require("./config");
const types = require('pg').types


let db;

if (process.env.NODE_ENV === "production") {
  db = new Client(getDatabaseConfig());
} else {
  db = new Client(getDatabaseConfig());
};

const parseNumeric = value => (value === null ? null : parseFloat(value));

types.setTypeParser(1700, parseNumeric);

db.connect();

module.exports = db;