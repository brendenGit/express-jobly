"use strict";

const { parse } = require("dotenv");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFiltering } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { title, salary, equity, companyHandle }
     *
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, 
                    salary, 
                    equity, 
                    company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        result.rows[0].equity = parseFloat(result.rows[0].equity);
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs. Or find a subset of jobs with filters.
     * Checks for filters
     * If filters are introduced checks validity of filters
     *
     * Returns [{ title, salary, equity, companyHandle }, ...]
     * */

    static async findAll(filters) {
        const jobsRes = await db.query(
            `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            ORDER BY id`
        )
        return jobsRes.rows;
    }


    /** Given a company handle, return jobs from that company.
     *
     * 
     **/

    static async getCompanyJobs(company_handle) {
        const jobsRes = await db.query(
            `SELECT title,
                    salary,
                    equity
            FROM jobs
            WHERE company_handle = $1`,
            [company_handle]);

        const jobs = jobsRes.rows;

        if (jobs.length === 0) throw new NotFoundError(`No jobs found for: ${company_handle}`);

        return jobs;
    }

    /** Given a company handle, return jobs from that company.
     *
     *  Returns {title, salary, equity, companyHandle}
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job found with id: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle: "company_handle"
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING title, 
                                    salary, 
                                    equity, 
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id, title`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}


module.exports = Job;
