const express = require('express');
const connectDB = require('./config/database.js');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

require("dotenv").config();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

const authRoute = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require('./routes/user');
const paymentRouter = require('./routes/payment.js');

app.use('/', authRoute);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);
app.use('/', paymentRouter);

connectDB().then(() => {
  console.log('Database connection successful');

  app.listen(7777, () => {
    console.log('Server is running');
  });
}).catch((err) => {
  console.log('DB cannot connect: ' + err.message);
});