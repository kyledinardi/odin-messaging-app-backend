require('dotenv').config();
require('./helper/passport');
const mongoose = require('mongoose');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const logger = require('morgan');
const debug = require('debug')('odin-messaging-app-backend:app');
const helmet = require('helmet');
const path = require('path');
const RateLimit = require('express-rate-limit');
const indexRouter = require('./routes/index');

const app = express();
const mongodb = process.env.MONGODB;

async function main() {
  await mongoose.connect(mongodb);
}

main().catch((err) => debug(err));

const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});

app.use(limiter);
app.use(cors());
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
