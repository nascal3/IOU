
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
};

// get all users names in the database
const allUsers = async () => {
    const names = [];
    const users = await User.findAll({
        attributes: ['name'],
        raw: true
    });

    users.forEach(user => {
        names.push(user.name)
    });
    return names;
};

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

// check if user owes money to another user
const checkCredit = async (borrowerID, creditorName) => {
    const results  = await Owes.findOne({
        where: {
            user_id: borrowerID,
            name: creditorName
        },
        raw: true
    });
    return results;
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

const getUserInformation = async(users, type) => {
    let userArr = [];

    if (type === 'all') {
        if (!Array.isArray(users)) return{
            status: 422,
            message: 'An array of users input required!'
        };
        userArr = users;

    } else {
        userArr = [users]
    }


    const sortedUsers = userArr.sort();

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
    for (let i=0; i<userArr.length; i++) {
        const group = groupResults( userArr[i], owesArray[i], owedByArray[i] );
        output.push(group)
    }
    return {
        status: 200,
        message: output
    };
};

module.exports = {
    getUserInformation : getUserInformation,
    mapUserIDs: mapUserIDs,
    allUsers: allUsers,
    checkCredit: checkCredit
};
