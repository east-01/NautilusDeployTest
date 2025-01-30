const sql = require('mssql');

function detectSqlType(value) {
	switch (typeof value) {
		case 'string':
			return sql.NVarChar;
		case 'number':
			return Number.isInteger(value) ? sql.Int : sql.Real;
		case 'boolean':
			return sql.Bit;
		case 'object':
			if (value instanceof Date) {
				return sql.DateTime;
			} else if (value === null) {
				return sql.NVarChar; // Default to NVarChar for null values
			}
			break;
		default:
			return sql.NVarChar; // Default to NVarChar for any unknown types
	}
}

module.exports = { detectSqlType };