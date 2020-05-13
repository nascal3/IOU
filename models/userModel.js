const Sequelize = require('sequelize');
const connection= require('../startup/db');

const userModel = connection.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type:Sequelize.STRING(50),
        allowNull: false
    }
},{
    timestamps: false
});

module.exports = userModel;
