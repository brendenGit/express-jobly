"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u3Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        title: "test",
        salary: 1,
        equity: 1.0,
        companyHandle: "c1",
    };

    test("ok for admins", async function () {

        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: newJob,
        });
    });

    test("unauth for non-admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: "test",
                equity: 1,
            })
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: 5.0,
            })
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon and ok without filters", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "Software Engineer 1",
                        salary: 150000,
                        equity: .25,
                        companyHandle: "c1"
                    },
                    {
                        title: "Software Engineer 2",
                        salary: 180000,
                        equity: .75,
                        companyHandle: "c1"
                    },
                    {
                        title: "Senior Software Engineer",
                        salary: 220000,
                        equity: .5,
                        companyHandle: "c1"
                    },
                    {
                        title: "VP of Growth",
                        salary: 175000,
                        equity: .5,
                        companyHandle: "c2"
                    },
                ],
        });
    });

    test("passes filters to model", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ title: 'software', minSalary: 180000 });

        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "Software Engineer 2",
                        salary: 180000,
                        equity: .75,
                        companyHandle: "c1"
                    },
                    {
                        title: "Senior Software Engineer",
                        salary: 220000,
                        equity: .5,
                        companyHandle: "c1"
                    },
                ],
        });
    });

    test("rejects: invalid filters", async function () {
        const resp = await request(app)
            .get("/companies")
            .query({ test: 'friend!' });

        expect(resp.status).toBe(400);
        expect(resp.body).toHaveProperty('error', { message: 'Invalid filters!', status: 400 });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        title: "Software Engineer 1",
        salary: 150000,
        equity: .25,
        companyHandle: "c1"
      },
    });
  });

  test("no job found with that id", async function () {
    const resp = await request(app).get(`/jobs/1000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "test",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({
      job: {
        title: "test",
        salary: 150000,
        equity: .25,
        companyHandle: "c1"
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "test",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "test",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found with that job id", async function () {
    const resp = await request(app)
      .patch(`/jobs/100000`)
      .send({
        title: "test",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        companyHandle: "new handle",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        test: "test",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found with that job id", async function () {
    const resp = await request(app)
      .delete(`/jobs/10000`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
