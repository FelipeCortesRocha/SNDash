const express = require("express");
const consign = require("consign");
const bodyParser = require('body-parser');
const hbs = require('hbs');
const dotenv = require('dotenv');
dotenv.config();

let app = express();

app.use(express.static('app/public'));
app.set('view engine', 'hbs');
app.set('views', './app/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

hbs.registerPartials('./app/views/partials');

consign()
    .include('./app/routes')
    .into(app);

process.env.API = "";
process.env.NODE_ENV = "DEV";

module.exports = app;