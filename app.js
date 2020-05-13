require('dotenv').config();
const express = require('express');
const app= express();

// CALL TO DB CONNECTION FOLDER
const sequelize = require('./startup/db');
const owesModel = require('./models/owesModel');
const owedByModel = require('./models/owedByModel');

// CALL TO ROUTES FOLDER
require('./startup/routes')(app);

( async() => {
    try {
        await sequelize.sync();
        await owesModel.sync();
        await owedByModel.sync();

        const port = process.env.PORT || 3000 ;
        app.listen( port, console.log(`listening to port ${port}`));
    } catch (err) {
        console.error('Error occurred: ',err.name, '<===> Message: ',err.message);
    }
})();
