const { BadRequestError } = require("../expressError");

/** 
 * This helper function allows us to more easily update values in a table.
 * @param {Object} dataToUpdate - An object representing the data to be updated in the table.
 * @param {Object} jsToSql - A mapping of JavaScript keys to their corresponding SQL column names.
 *                           It helps convert JavaScript naming to SQL naming.
 *                           Example: { firstName: "first_name" }
 * @throws {BadRequestError} Throws an error if the data to update is empty.
 * @returns {Object} An object with values to update in the table.
 *                  Example: { setCols: '"first_name"=$1, "age"=$2', values: ['brenden', '30'] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // If we find a value written in js (e.g., jsToSql[firstName]), we will update it to 'first_name' to match the table.
  // Alternatively, we use the default colName already matched with the table.

  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  /** We return an object with values to udpate. Example below:
   * {
   *  setCols: `'"first_name"=$1, "age"=$2'`
   *  values: ['brenden', '30'];
   * }
   */
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


/** This helper function returns the paramters for a WHERE clause
 * @param {object} filters - An object of query strings for filtering
 * @returns {object} An object with the where clause and the values for the clause
 *                  Example: { setWhere: '"handle" LIKE $1', values: [ '%net%' ]  
 */
function sqlForFiltering(filters) {
  const keys = Object.keys(filters);

  const cols = keys.map((colName, idx) => {
    if (colName === 'minEmployees') {
      return `"num_employees">=$${idx + 1}`
    } else if (colName === 'maxEmployees') {
      return `"num_employees"<=$${idx + 1}`
    } else if (colName === 'name') {
      return `"handle" LIKE $${idx + 1}`
    }
  });

  return {
    setWhere: cols.join(" AND "),
    values: keys.map(key => (key === 'name' ? `%${filters[key]}%` : filters[key])),
  };
}

module.exports = {
  sqlForPartialUpdate,
  sqlForFiltering
};
