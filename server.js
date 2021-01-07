
const express = require('express');
const app = express();
const port = 5000; 
const routes = require('./routes');
var cors = require('cors');
const bodyParser = require('body-parser');
const static = express.static('public');

app.use(cors());

app.use(static);
//app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', routes);

app.listen(port, () => {
    console.log(`| Server now listening to http://127.0.0.1:${port}/ |`);
});