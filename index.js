const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Express App
const server = express();

// Middleware
server.use(express.json());
server.use(bodyParser.json());
server.use(cors({
    origin: ["https://myshopdesk.onrender.com", "http://localhost:5173/", "http://localhost:5173/Product","http://localhost:5173/Enquiry","http://localhost:5173/Order","http://localhost:5173/Sales","http://localhost:5173/Staff","http://localhost:5173/Invoice","http://localhost:5173/Customer","http://localhost:5173/ThirdPartyF"]
}));

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
