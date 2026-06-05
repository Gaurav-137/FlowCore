const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : path.resolve(__dirname, '../.env.example');

dotenv.config({ path: envPath });

jest.setTimeout(30000);
