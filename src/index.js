// require('dotenv').config({path:'.env'})
import connectDb from './db/index.js'
connectDb()

import dotenv from 'dotenv'

dotenv.config({
  path: './env',
})

// function connectDb() {}

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//   } catch (error) {
//     console.log(Error, error);
//     throw error;
//   }
// })();
