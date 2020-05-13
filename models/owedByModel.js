const Sequelize = require('sequelize');
const connection= require('../startup/db');
const userModel = require('./userModel');

const nameModel = connection.define('owed_by', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type:Sequelize.INTEGER,
        references: {
            model: userModel,
            key: userModel.id
        },
        allowNull: false
    },
    name: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    amount: {
        type:Sequelize.FLOAT,
        allowNull: false
    }
},{
    timestamps: false,
    freezeTableName: true
});

module.exports = nameModel;
