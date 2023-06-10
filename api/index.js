const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const wss = require('ws');
const Message = require('./models/message');
const fs = require('fs');


dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const JWT_SECRET = process.env.JWT_KEY;
const hash_salt = bcrypt.genSaltSync(10);

const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

async function getUserData(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(
                token,
                JWT_SECRET,
                {},
                (err, userData) => {
                    if (err) throw err;
                    resolve(userData);
                }
            );
        }
        else {
            reject('no token');
        }
    });
}

app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    const userData = await getUserData(req);
    const myUserId = userData.userId;
    const allMessages = await Message.find({
        sender: { $in: [userId, myUserId] },
        recipient: { $in: [userId, myUserId] },
    }).sort({ createdAt: 1 });
    res.json(allMessages);
});

app.get('/profile', (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(
            token,
            JWT_SECRET,
            {},
            (err, userData) => {
                if (err) throw err;
                res.json(userData);
            }
        );
    }
    else {
        res.status(401).json('NO TOKEN');
    }
});

app.get('/people', async (req, res) => {
    const allUsers = await User.find({}, { "_id": 1, username: 1 });
    res.json(allUsers);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });

    if (foundUser) {
        const verified = bcrypt.compareSync(password, foundUser.password);
        if (verified) {
            jwt.sign(
                { userId: foundUser._id, username },
                JWT_SECRET,
                {},
                (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token, {
                        sameSite: 'none', secure: true
                    }).json({
                        id: foundUser._id
                    });
                });
        }
        else {
            res.json('invalid');
        }
    } else {
        res.json('unknown');
    }

});

app.post('/logout', (req, res) => {
    res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });
    if (foundUser) res.json('repeated');
    else
        try {

            const hashed_pass = bcrypt.hashSync(password, hash_salt);
            const newUser = await User.create({
                username: username,
                password: hashed_pass
            });

            jwt.sign(
                { userId: newUser._id, username },
                JWT_SECRET,
                {},
                (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token, {
                        sameSite: 'none', secure: true
                    }).status(201).json({
                        id: newUser._id
                    });
                })
        }
        catch (err) {
            if (err) throw err;
            res.status(500).json('error');
        }

})

const server = app.listen(4040);

const ws_server = new wss.WebSocketServer({ server });

ws_server.on('connection', (connection, req) => {

    function notifyAboutOnlinePeople() {
        [...ws_server.clients].forEach(
            client => {
                client.send(JSON.stringify(
                    {
                        online: [...ws_server.clients].map(
                            c => ({ userId: c.userId, username: c.username })
                        )
                    }
                ));
            }
        );
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });


    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookie = cookies.split(';').find(str => str.startsWith('token='));
        if (tokenCookie) {
            const token = tokenCookie.split('=')[1];
            if (token) {
                jwt.verify(token, JWT_SECRET, {}, (err, userData) => {
                    if (err) throw err;
                    const { userId, username } = userData;
                    connection.userId = userId;
                    connection.username = username;
                });
            }
        }
    }

    connection.on('message', async (message) => {
        const messageRecived = JSON.parse(message.toString());
        const { recipient, text, file } = messageRecived;
        let newFileName = null;
        if (file) {
            const ext = file.fileName.split('.').slice(-1);
            newFileName = Date.now() + '.' + ext[0];
            const filePath = __dirname + '/uploads/' + newFileName;
            const bufferData = new Buffer.from(file.data.split(',')[1], 'base64');
            fs.writeFile(filePath, bufferData, () => {
            })
        }
        if (recipient && (text || file)) {
            const MessageDoc = await Message.create({
                sender: connection.userId, recipient, text, file: file ? newFileName : null,
            });


            [...ws_server.clients]
                .filter(cl => cl.userId === recipient).forEach(cl => {
                    cl.send(JSON.stringify({
                        text,
                        sender: connection.userId,
                        recipient,
                        file: file ? newFileName : null,
                        _id: MessageDoc._id
                    }))
                })
        }
    });

    notifyAboutOnlinePeople();

});