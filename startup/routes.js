const express = require('express');
const cors = require('cors');
const iou = require('../routes/iou');

module.exports = (app) => {
  app.use(
    cors(),
    express.json()
  );
  app.use('/api', iou);
};
