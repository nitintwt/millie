import express from 'express'
import cors from 'cors'
import googleRouter from './routes/google.routes'
import agentRouter from './routes/agent.routes'
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
app.use("/api/v1/agent" , agentRouter)

export {app}