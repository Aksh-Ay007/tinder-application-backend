const express = require('express');
const connectDB = require('./config/database.js');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require("http");

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
const paymentRouter = require('./routes/payment');
const initializeSocket = require('./utils//socket');
const chatRouter = require('./routes/chat.js');
const chatMediaRouter = require('./routes/chatMedia.js');

app.use('/', authRoute);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);
app.use('/', paymentRouter);
app.use('/', chatRouter);
app.use('/', chatMediaRouter);





const server = http.createServer(app);
initializeSocket(server);


connectDB().then(() => {
  console.log('Database connection successful');

  server.listen(8888, () => {
    console.log('Server is running');
  });
}).catch((err) => {
  console.log('DB cannot connect: ' + err.message);
});