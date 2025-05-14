const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Express App
const server = express();

// Middleware
server.use(express.json());
server.use(bodyParser.json());
server.use(cors());

// Routes
server.use('/api', require('./routes/enquiryRoutes'));
server.use('/api', require('./routes/productRoutes'));
server.use('/api', require('./routes/orderRoutes'));
server.use('/api', require('./routes/staffRoutes'));
server.use('/api', require('./routes/customerRoutes'));
server.use('/api', require('./routes/tpfRoutes'));
server.use('/api', require('./routes/attendanceRoutes')); 
server.use('/api', require('./routes/invoiceRoutes'))

// Connect to DB
connectDB();

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
