/**
 * Evaluate json to be used as an identifier. Used in fetch and contains operations.
 * Returns a list with:
 *   - boolean to show valid or not
 *   - string to show invalid reason
 * @param {Object} json - The JSON data to evaluate.
 * @returns {[boolean, string]} - A tuple with a boolean and a string.
 */
function evaluate_id_json(json) {
	if(!json.hasOwnProperty('table')) {
		return [false, 'Missing table value.'];
	}
	if(!json.hasOwnProperty('uid')) {
		return [false, 'Missing uid value.'];
	}
    return [true, '']
}

/**
 * Evaluate json to be used in the insert operation.
 * Returns a list with:
 *   - boolean to show valid or not
 *   - string to show invalid reason
 * @param {Object} json - The JSON data to evaluate.
 * @returns {[boolean, string]} - A tuple with a boolean and a string.
 */
function evaluate_insert_json(json) {
	if(!json.hasOwnProperty('table')) {
		return [false, 'Missing table value.'];
	}
	if(!json.hasOwnProperty('data')) {
		return [false, 'Missing data value.'];
	}
    data = json['data']
    if(!data.hasOwnProperty('uid')) {
        return [false, 'JSON data doesn\'t have uid key.']
    }
    return [true, '']
}

module.exports = { evaluate_id_json, evaluate_insert_json };