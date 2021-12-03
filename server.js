const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { response } = require('express');

let env = require('dotenv').config();

const app = express();
const Schema = mongoose.Schema;

/* ----------------------------------- */
const userScheme = new Schema({
    balance: String,
    picture: String,
    age: Number,
    name: String,
    gender: String,
    company: String,
    email: String,
    friends: [],
    pendingFriends: []
});
/* ----------------------------------- */

const User = mongoose.model("User", userScheme);

const host = 'localhost';

const MONGODB_LINK = process.env.MONGODB_LINK;
console.log(MONGODB_LINK);
mongoose.connect(MONGODB_LINK, { useUnifiedTopology: true, useNewUrlParser: true })

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/addFriend", (req, res) => {
    // передается id пользователя который хочет добавиться в друзья и к кому
    const idUserRequest = req.body.friendRequests; // запрос от кого 
    const idUserTarget = req.body.friendTarget; // запрос кому 

    if (idUserRequest && idUserTarget) {
        User.findById(idUserRequest, (err, request) => {
            if(err){
                res.send(err);
            }
            else if(request) {
                User.findById(idUserTarget, (err, target) => {
                    if (err) {
                        res.send(err);
                    }
                    else if(target) {
                        User.findByIdAndUpdate(idUserTarget, 
                            {"$push": {"pendingFriends": idUserRequest}},
                            {"new": true, "upsert": true},
                            (err, user) => {
                                if (err) {
                                    res.send(err);
                                }
                            }
                        );
                    }
                    else {
                        res.status(404).send("Target user does not exist!");
                    }

                    res.status(200).json({
                        success: true
                    });
                });
            }
            else {
                res.status(404).send("Requested user does not exist!");
            }
        });
    }
    else {
        res.status(400).send("wrong parameters!");
    }
});

app.post('/getFriends', (req, res) => {
    const idUserRequest = req.body.friendRequests; 
    const requestFlag = req.body.flag;
    if (idUserRequest) {
        User.findById(idUserRequest, function(err, user) {
            if(err) {
                res.send(err);
            }
            else if (user) {
                User.find({_id: { $in: user.friends } })
                .exec((err, friends) => {
                    if (err) {
                        res.send("ошибка4");
                        res.send(err);
                    }
                    else if(requestFlag && friends && friends.length > 0) {
                        friends = friends.map(obj => obj.name);
                        
                        User.updateOne({_id: idUserRequest}, {
                            $set: {
                                friends: req.body.pendingFriends,
                                pendingFriends: req.body.pendingFriends.pop()
                            }
                            }, function(error, newuser){
                            if(error) {
                                res.status(404).json({error: error});
                            }
                            else {
                                res.status(200).json(newuser);
                            }
                        });
                        User.updateOne({_id: friends[0]}, {
                            $set: {
                                friends: idUserRequest,
                                pendingFriends: req.body.pendingFriends.pop()
                            }
                            }, function(error, newuser){
                            if(error) {
                                res.status(404).json({error: error});
                            }
                            else {
                                res.status(200).json(newuser);
                            }
                        });
                    }
                    else if(!requestFlag && friends && friends.length > 0) {
                        res.send("пользователь отклонил Ваш запрос в друзья");
                    } else {
                        //res.send(requestFlag); 
                        
                        //res.send(friends); 
                        //res.send(friends.length);
                        res.status(200).send("ошибка3");
                    }
                });
            } else {
                res.status(404).send("ошибка2")
            }
        });
    } else {
        res.status(400).send("ошибка1");
    }
});

app.get('/', (req, res) => {
    User.find({}, function(error, users){
        
        if(error) {
            res.status(404).json({error: error});
        }
        else {
            res.status(200).json(users);
        }
    });
});
app.get('/:userId', (req, res) => {
    const id = req.params.userId;
    User.findById({_id: id}, function(error, user){
         
        if(error) {
            res.status(404).json({error: error});
        }
        else {
            res.status(200).json(user);
        }
    });
});
app.post('/', (req, res) => {
    User.create({
            _id: new mongoose.Types.ObjectId(),
            balance: req.body.balance,
            picture: req.body.picture,
            age: req.body.age,
            name: req.body.name,
            gender: req.body.gender,
            company: req.body.company,
            email: req.body.email,
            friends: req.body.friends,
            pendingFriends: req.body.pendingFriends
        }, function(error, newuser) {
          
        if(error) {
            res.status(404).json({error: error});
        }
        else {
            res.status(200).json(newuser);
        }
    });
});
app.put('/:userId', (req, res) => {
    const id = req.params.userId;
    User.updateOne({_id: id}, {
            balance: req.body.balance,
            picture: req.body.picture,
            age: req.body.age,
            name: req.body.name,
            gender: req.body.gender,
            company: req.body.company,
            email: req.body.email,
            friends: req.body.friends,
            pendingFriends: req.body.pendingFriends
        }, function(error, newuser){
        if(error) {
            res.status(404).json({error: error});
        }
        else {
            res.status(200).json(newuser);
        }
    });
});
app.delete('/:userId', (req, res) => {
    const id = req.params.userId;
    User.deleteOne({_id: id}, function(error, result){
             
            if(error) {
                res.status(404).json({error: error});
            }
            else {
                res.status(200).json(result);
            }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, host, function () {
    console.log(`Server listens http://${host}:${PORT}`)
});