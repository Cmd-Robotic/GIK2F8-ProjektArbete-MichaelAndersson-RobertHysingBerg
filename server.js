const express = require('express');
const session = require('express-session');
// got an error with single quotation marks but not with double, I am afraid
const routes = require('./routes');
var cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;
const static = express.static('public');

app.use(cors());

app.use(static);
app.use(session({
    secret: 'DeimosIsReal',
    saveUninitialized: false,
    resave: false
}));

//app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', routes);

app.listen(port, () => {
    console.log(`| Server now listening to http://127.0.0.1:${port}/ |`);
});