const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before any application modules are imported
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send({ message: 'Hyper Local Event Hub API is running' });
});

app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the process using this port or change PORT in .env.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
