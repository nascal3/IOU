const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const User = require('../models/userModel');

const helpers = require('../helper/helpers');
require('express-async-errors');

// GET ALL USERS INFORMATION.
router.get('/users', async(req, res) => {
    const users = req.body.users;
    const type = 'all';
    const results = await helpers.getUserInformation(users, type);
    res.status(results.status).json({'users': results.message});
});

// CREATE NEW USER
router.post('/add', async (req, res) => {
    const user = req.body.user;
    if (typeof user !== 'string') return res.status(422).json({'error': 'A user name input of type string required!'});
    if (!user) return res.status(422).json({'error': 'A user name input required!'});

    const newUser = await User.create({
        name: user
    });

    const users = newUser.dataValues.name;
    const type = 'one';
    const results = await helpers.getUserInformation(users, type);

    res.status(200).json({'user': results});
});

module.exports = router;
