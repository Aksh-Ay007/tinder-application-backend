const express = require('express');
const connectDB = require('./config/database.js');

const app = express();

const User = require('./models/user');
const { Error } = require('mongoose');

app.use(express.json());

app.post('/signup', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        res.send('User added successfully');
    } catch (err) {
        res.status(400).send('Error saving the user: ' + err.message);
    }
});

app.get('/user', async (req, res) => {
    const userEmail = req.body.emailId;

    try {
        const user = await User.find({ emailId: userEmail });

        if (user.length === 0) {
            res.send('Sorry, user is not found');
        } else {
            res.send(user);
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

app.get('/feed', async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(400).send('Users not found: ' + error.message);
    }
});

app.delete('/user', async (req, res) => {
    const userId = req.body.userId;

    try {
        await User.findByIdAndDelete(userId);
        res.send('User deleted successfully');
    } catch (error) {
        res.status(400).send('Delete not done: ' + error.message);
    }
});

app.patch('/user/:userId', async (req, res) => {
    const userId = req.params?.userId;
    const data = req.body;

    try {
        const ALLOWED_UPDATES = ['userId', 'age', 'gender', 'bio', 'photoUrl', 'hobby','skills'];
        const isUpdateAllowed = Object.keys(data).every((key) => ALLOWED_UPDATES.includes(key));

        if (!isUpdateAllowed) {
            throw new Error("Update not allowed");
        }

        const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });

        if (!user) {
            return res.status(404).send('User not found');
        }

        if(data?.skills.length>3){
           
            throw new Error("more than 3 skills is not allowed")
        }

        res.send('User updated successfully');
    } catch (err) {
        res.status(400).send('Error updating user: ' + err.message);
    }
});

connectDB().then(() => {
    console.log('Database connection successful');

    app.listen(7777, () => {
        console.log('Server is running');
    });
}).catch((err) => {
    console.log('DB cannot connect: ' + err.message);
});