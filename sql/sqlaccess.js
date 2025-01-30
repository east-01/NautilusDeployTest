const express = require('express');
const app = express();
const port = 8921;

const { fetch, contains, insert } = require('./sqloperations')

// SQL Server configuration
const config = {
	user: 'unity',
	password: 'MoreLike_DataBass115!',
	server: 'localhost',
	database: 'testdb',
	options: {
		encrypt: true, // for Azure
		trustServerCertificate: true // for local development
	}
};

app.post('/fetch', express.json(), async (req, res) => {
	try {
		const data = await fetch(config, req.body)
		res.json(data)
	} catch(err) {
		output = `Fetch failed: ${err.message}\nBody:\n${JSON.stringify(req.body, null, 4)}`
		console.log(output)
		res.status(500).json({ error: output })
	}
});

app.post('/contains', express.json(), async (req, res) => {
	try {
		const containsBool = await contains(config, req.body)
		res.json({ contains: containsBool })
	} catch(err) {
		output = `Contains failed: ${err.message}\nBody:\n${JSON.stringify(req.body, null, 4)}`
		console.log(output)
		res.status(500).json({ error: output })
	}
});

app.post('/insert', express.json(), async (req, res) => {
	try {
		const rowsAffected = await insert(config, req.body);
		res.json({ message: `Data inserted successfully: ${rowsAffected}` });
	} catch (err) {
		output = `Insert failed: ${err.message}\nBody:\n${JSON.stringify(req.body, null, 4)}`
		console.log(output)
		res.status(500).json({ error: output })
	}
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
