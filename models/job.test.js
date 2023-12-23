"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "Sales Development Representative",
        salary: 70000,
        equity: .01,
        companyHandle: "c3"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE title = 'Sales Development Representative'`);
        expect(result.rows).toEqual([
            {
                title: "Sales Development Representative",
                salary: 70000,
                equity: "0.01",
                companyHandle: "c3"
            },
        ]);
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: "Software Engineer 1",
                salary: 150000,
                equity: "0.25",
                companyHandle: "c1"
            },
            {
                title: "Software Engineer 2",
                salary: 180000,
                equity: "0.5",
                companyHandle: "c1"
            },
            {
                title: "Senior Software Engineer",
                salary: 220000,
                equity: "0.75",
                companyHandle: "c1"
            },
            {
                title: "VP of Growth",
                salary: 175000,
                equity: "0.5",
                companyHandle: "c2"
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("getCompanyJobs works", async function () {
        let jobs = await Job.getCompanyJobs("c1");
        expect(jobs).toEqual([
            {
                title: "Software Engineer 1",
                salary: 150000,
                equity: "0.25",
            },
            {
                title: "Software Engineer 2",
                salary: 180000,
                equity: "0.5",
            },
            {
                title: "Senior Software Engineer",
                salary: 220000,
                equity: "0.75",
            },
        ]);
    });

    test("get job by id", async function () {
        let job = await Job.get(2);
        expect(job).toEqual({
            title: "Software Engineer 1",
            salary: 150000,
            equity: "0.25",
            companyHandle: "c1"
        })
    })

    test("not found if no jobs with company", async function () {
        try {
            await Job.getCompanyJobs("c3");
            fail();
        } catch (err) {
            console.log(err);
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "SWE 1",
        salary: 120000,
        equity: .01
    };

    test("works", async function () {
        let job = await Job.update(2, updateData);
        expect(job).toEqual({
            title: "SWE 1",
            salary: 120000,
            equity: "0.01",
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 2`);
        expect(result.rows).toEqual([{
            title: "SWE 1",
            salary: 120000,
            equity: "0.01",
            companyHandle: "c1"
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New",
            salary: null,
            equity: null,
        };

        let job = await Job.update(2, updateDataSetNulls);
        expect(job).toEqual({
            ...updateDataSetNulls,
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 2`);
        expect(result.rows).toEqual([{
            title: "New",
            salary: null,
            equity: null,
            companyHandle: "c1"
        }]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(1000, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(1, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(2);
        const res = await db.query(
            "SELECT title FROM jobs WHERE id=1");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(1000);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
