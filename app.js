require('dotenv').config()
require("./database/database").connect()
const User = require('./model/user')
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const user = require('./model/user')
const cookieParser = require('cookie-parser')
const auth = require('./middleware/auth')

const app = express()
app.use(express.json())
app.use(cookieParser())


app.get("/", (req, res) =>{
    res.send("<h1>Server is working</h1>")
})


app.post("/register", async (req, res) => {
    try {
        // get all data from body
        const{firstname, lastname, email, password} = req.body
        // all the data should exist
        if (!(firstname && lastname && email && password)) {
            res.status(400).send('All fields are compulsory')
        }
        // check if user already exsists- email
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            res.status(401).send('User already exists with this mail')
        }

        // encrypt the password
        const myEncPassword = await bcrypt.hash(password, 10)
        // save the user in DB
        const user = await User.create({
            firstname,
            lastname,
            email,
            password: myEncPassword
        })

        // generate a token for user and send it
        const token= jwt.sign(
            {id: user._id, email},
            'shhhh', //process.env.jwtsecret
            {
                expiresIn: "2h"
            }
        );
        user.token = token
        user.password = undefined

        res.status(201).json(user)


    } catch (error) {
        console.log(error);
    }
})

app.post('/login', async (req, res) => {
    try {
        //get all data from frontend
        const{email, password} = req.body
        //validation
        if(!(email && password)){
            res.status(400).send('send all data')
        }
        //find user in DB
        await User.findOne({email})
        //if useer is not there??

        //match the password
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                {id: user.id},
                'shhhh', // process.env.jwtsecret
                {
                    expiresIn: "2h"
                }
            );
            user.token=token
            user.password = undefined

            //send token in user cookie
            //cookie section
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            };
            res.status(200).cookie("token", token, options).json({
                success: true,
                token,
                user
            })
        }
    } catch (error) {
        console.log(error);
    }
})

app.get("/dashboard", auth, (req, res) => {

    
    res.send('Welcome to Dashboard')
})



module.exports = app