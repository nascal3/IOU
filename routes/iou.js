const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const User = require('../models/userModel');
const OwedBy = require('../models/owedByModel');
const Owes = require('../models/owesModel');

require('express-async-errors');

// map a users name to their ID in the database
const mapUserIDs = async (userName) => {
    const userID = await User.findOne({
        attributes: ['id'],
        where: {
            name: userName
        },
        raw: true
    });
    return userID;
}

// get all users owed money
const getAllDebtors = async (id) => {
    const debtors =  await Owes.findAll({
        attributes: { exclude: ['id', 'user_id'] },
        where: {
            user_id: id
        },
        raw: true
    });
    return debtors;
};

// get all users owing money
const getAllCreditors = async (id) => {
    const creditors = await OwedBy.findAll({
        attributes: { exclude: ['id', 'user_id'] },
        where: {
            user_id: id
        },
        raw: true
    });
    return creditors;
};

// format debtors/creditors records to wanted output format
const formatRecordOutput = (recordsArray) => {
   const outputFormat = {};
   recordsArray.forEach(person => {
       outputFormat[person.name] = person.amount
   });
   return outputFormat;
};

// add values in each category
const total = ( obj ) => {
    let sum = 0;
    for( let amount in obj ) {
        if( obj.hasOwnProperty( amount ) ) {
            sum += obj[amount];
        }
    }
    return sum;
};

// group users result
const groupResults = ( name, owesArray, owedByArray ) => {
    let output = {};
    output['name'] = name;
    output['owes'] = owesArray;
    output['owed_by'] = owedByArray;
    output['balance'] = total(owedByArray) - total(owesArray);

    return output;
};


// GET ALL USERS INFORMATION.
router.get('/users', async(req, res) => {
    const users  = req.body.users;
    if (!Array.isArray(users)) return res.status(422).json({'error': 'An array of users input required!'});

    const sortedUsers = users.sort();

    const userIDs = [];
    await Promise.all(sortedUsers.map(async (name) => {
        let userID = await mapUserIDs(name);
        userIDs.push(userID.id);
    }));

    const debtors = [];
    const creditors = [];
    await Promise.all(userIDs.map(async (id) => {
        let debtor = await getAllDebtors(id);
        debtors.push(debtor);
        let creditor = await getAllCreditors(id);
        creditors.push(creditor);
    }));


    const owesArray = [];
    debtors.forEach(debtor => {
       let owes = formatRecordOutput(debtor)
       owesArray.push(owes)
    });

    const owedByArray = [];
    creditors.forEach(creditor => {
        let owedBy = formatRecordOutput(creditor)
        owedByArray.push(owedBy)
    });

    const output = [];
    for (let i=0; i<users.length; i++) {
        const group = groupResults( users[i], owesArray[i], owedByArray[i] );
        output.push(group)
    }

    res.status(200).json({'users': output});
});

// CREATE NEW USER
router.post('/add', async (req, res) => {



});

module.exports = router;
