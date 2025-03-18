const express = require('express');
const connectDB = require('./config/database.js');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());

const authRoute = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');

app.use('/', authRoute);
app.use('/', profileRouter);
app.use('/', requestRouter);

connectDB().then(() => {
  console.log('Database connection successful');

  app.listen(7777, () => {
    console.log('Server is running');
  });
}).catch((err) => {
  console.log('DB cannot connect: ' + err.message);
});