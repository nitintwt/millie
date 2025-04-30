import express from 'express'
import cors from 'cors'
import googleRouter from './routes/google.routes'
const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials:true
}))

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended: true , limit:"16kb"})) 

app.get("/" , (req , res)=>{
  return res.status(200).json({message:"Going good from Millie"})
})
app.use("/api/v1/google", googleRouter)

export {app}