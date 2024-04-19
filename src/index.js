import { app } from './app.js';
import connectDb from './db/index.js'
import dotenv from 'dotenv'

dotenv.config({
  path: './env',
})
// const app = express();
connectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`The server is running at ${process.env.PORT}`)
    })
}
)
.catch((err) => {
    console.log("Mongo DB connection failed !!!" ,err)
})
