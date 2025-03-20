const express = require('express');
const app = express();

const paymentRoutes = require('./paymentRoutes');

// Register payment routes
app.use('/api/payments', paymentRoutes);

module.exports = app; 