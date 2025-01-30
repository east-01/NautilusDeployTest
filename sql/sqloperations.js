const sql = require('mssql');

const { evaluate_id_json, evaluate_insert_json } = require('./jsonevalvisitors')
const { detectSqlType } = require('./sqlutils')

/**
 * Fetches a row from the specified database and table based on the UID.
 *
 * @param {Object} config - The database connection configuration.
 * @param {Object} id_json - The JSON object containing database, table, and uid.
 * @returns {Promise<Object[]>} - The result recordset from the query.
 * @throws {Error} - If the id_json is invalid or if there is a SQL error.
 */
async function fetch(config, id_json) {
	// Ensure id_json is valid
	const [isValid, errorMsg] = evaluate_id_json(id_json)
	if(!isValid)
		throw new Error(errorMsg);

	const database = config['database']
	const { table, uid } = id_json

	try {
		// Connect to the database
		let pool = await sql.connect(config); 

		// Switch to the specified database
		await pool.request().query(`USE ${database}`);

		// Execute the query
		let result = await pool.request()
			.input('uid', sql.VarChar, uid)
			.query(`SELECT * FROM ${table} WHERE uid=@uid`);

		if(result.recordset.length > 1) {
			console.warn(`Warning: Request yielded multiple results- uids should be unique in the table.`);
			return null;
		}

		// Return the result
		return result.recordset[0];
	} catch (err) {
		console.error('SQL error', err);
		throw err;
	} finally {
		// Close the database connection
		await sql.close()
	}
}

/**
 * Checks if a row with the specified UID is contained in the database.
 *
 * @param {Object} config - The database connection configuration.
 * @param {Object} id_json - The JSON object containing database, table, and uid.
 * @returns {Promise<boolean>} - True/False if the json is in the database
 * @throws {Error} - If the id_json is invalid or if there is a SQL error.
 */
async function contains(config, id_json) {

	// Ensure id_json is valid
	const [isValid, errorMsg] = evaluate_id_json(id_json)
	if(!isValid)
		throw new Error(errorMsg);
	
	const database = config['database']
	const { table, uid } = id_json

	console.log(`Checking if UID ${uid} is in table ${table} of database ${database}`);

    try {
        // Connect to the database
        const pool = await sql.connect(config);

        // Switch to the specified database
        await pool.request().query(`USE ${database}`);

        // Execute the query
        const result = await pool.request()
            .input('uid', sql.VarChar, uid)
            .query(`SELECT COUNT(*) as count FROM ${table} WHERE uid=@uid`);
		
        // Check if the row exists
        return result.recordset[0].count > 0;
    } catch (err) {
        console.error('SQL error', err);
        throw err;
    } finally {
        // Close the database connection
        await sql.close();
    }
}

/**
 * Insert/update a row in the database. If the uid already exists in the database, that entry will
 *   be updated. If the uid doesn't already exist in the database it will be added.
 *
 * @param {Object} config - The database connection configuration.
 * @param {Object} id_json - The JSON object containing database, table, and uid.
 * @returns {Promise<boolean>} - True/False if the json is in the database
 * @throws {Error} - If the id_json is invalid or if there is a SQL error.
 */
async function insert(config, insert_json) {
	// Ensure insert_json is valid
	const [isValid, errorMsg] = evaluate_insert_json(insert_json)
	if(!isValid)
		throw new Error(errorMsg);
	
	const database = config['database']
	const { table, data } = insert_json

	console.log(`Inserting data into database ${database} and table ${table}`);

	// Create an array of column names and an array of corresponding values
	const columns = Object.keys(data);
	const values = Object.values(data);

	// Construct the SQL query dynamically
	const columnNames = columns.join(', ');
	const paramNames = columns.map((col, index) => `@param${index}`).join(', ');

	try {
		let pool = await sql.connect(config);
		await pool.request().query(`USE ${database}`);
	
		let request = pool.request();
	
		// Add inputs dynamically with detected types
		columns.forEach((col, index) => {
			request.input(`param${index}`, detectSqlType(values[index]), values[index]);
		});
	
		const uid = data.uid;
		request.input('uid', detectSqlType(uid), uid);

		// Construct the MERGE statement
        let mergeQuery = `
            MERGE INTO ${table} AS target
            USING (SELECT ${paramNames}) AS source (${columnNames})
            ON (target.uid = @uid)
            WHEN MATCHED THEN
                UPDATE SET ${columns.map((col, index) => `target.${col} = source.${col}`).join(', ')}
            WHEN NOT MATCHED THEN
                INSERT (${columnNames}) VALUES (${paramNames});
        `;

		let result = await request.query(mergeQuery);
	
		return result.rowsAffected;
	} catch (err) {
		console.error('SQL error', err);
		throw err;
	}
}

module.exports = { fetch, contains, insert };
