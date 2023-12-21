"use strict";

describe("config can come from env", function () {
  test("works", function() {
    process.env.SECRET_KEY = "abc";
    process.env.PORT = "5000";
    process.env.DB_NAME = "other";
    process.env.NODE_ENV = "other";

    const config = require("./config");
    expect(config.SECRET_KEY).toEqual("abc");
    expect(config.PORT).toEqual(5000);
    let dbConfig = config.getDatabaseConfig();
    expect(dbConfig.database).toEqual("other");
    expect(config.BCRYPT_WORK_FACTOR).toEqual(12);

    delete process.env.SECRET_KEY;
    delete process.env.PORT;
    delete process.env.BCRYPT_WORK_FACTOR;
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;

    dbConfig - config.getDatabaseConfig();
    expect(dbConfig.database).toEqual(process.env.DB_NAME);

    process.env.NODE_ENV = "test";
    dbConfig = config.getDatabaseConfig();
    expect(dbConfig.database).toEqual(process.env.DB_TEST_NAME);
  });
})

