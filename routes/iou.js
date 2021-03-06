const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const OwedBy = require('../models/owedByModel');
const Owes = require('../models/owesModel');
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
    if (typeof user !== 'string' || !user) return res.status(422).json({'error': 'A user name input of type string required!'});

    const newUser = await User.create({
        name: user
    });

    const users = newUser.dataValues.name;
    const type = 'one';
    const results = await helpers.getUserInformation(users, type);

    res.status(200).json({'user': results});
});

// CREATE IOU
router.post('/iou', async (req, res) => {
    const lender = req.body.lender;
    const borrower = req.body.borrower;
    const amount = req.body.amount;

    if (typeof lender !== 'string' || !lender) return res.status(422).json({'error': 'A lender name input of type string required!'});
    if (typeof borrower !== 'string' || !borrower) return res.status(422).json({'error': 'A borrower name input of type string required!'});
    if (isNaN(amount) || !amount) return res.status(422).json({'error': 'Amount input of type number required!'});


    const lenderInfo = await helpers.mapUserIDs(lender);
    if (!lenderInfo.id) return res.status(404).json({'error': 'The following lender does not exist!'});

    const borrowerInfo = await helpers.mapUserIDs(borrower);
    if (!borrowerInfo.id) return res.status(404).json({'error': 'The following borrower does not exist!'});

    const credit = await helpers.checkCredit(borrowerInfo.id, lender);
    if (credit) {
        const currentCredit = credit.amount + amount;
        await Owes.update(
            {
                amount: currentCredit
            },
            {
                where: {
                    user_id: borrowerInfo.id,
                    name: lender
                }
            }
        );

        await OwedBy.update(
            {
                amount: currentCredit
            },
            {
                where: {
                    user_id: lenderInfo.id,
                    name: borrower
                }
            }
        );
    } else {
        await Owes.create({
            user_id: borrowerInfo.id,
            name: lender,
            amount: amount
        });

        await OwedBy.create({
            user_id: lenderInfo.id,
            name: borrower,
            amount: amount
        });
    }

    const allUsers = await helpers.allUsers();
    const type = 'all';
    const results = await helpers.getUserInformation(allUsers, type);

    res.status(results.status).json({'users': results});
});

// REMOVE USER
router.delete('/delete', async (req, res) => {
    const user = req.body.user;
    if (typeof user !== 'string' || !user) return res.status(422).json({'error': 'A user name input of type string required!'});

    const userInfo = await helpers.mapUserIDs(user);
    if (!userInfo.id) return res.status(404).json({'error': 'The following user does not exist!'});

    await Owes.destroy({
        where: {
            user_id: userInfo.id
        }
    });
    await OwedBy.destroy({
        where: {
            [Op.or]: [
                { name: user } , 
                { user_id: userInfo.id }
            ]
        }
    });
    await User.destroy({
        where: {
            [Op.or]: [
                { name: user } , 
                { user_id: userInfo.id }
            ]
        }
    });

    const allUsers = await helpers.allUsers();
    const type = 'all';
    const results = await helpers.getUserInformation(allUsers, type);

    res.status(200).json({'user': results});
});

module.exports = router;
