import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.routes.js'
import agentRouter from './routes/agent.routes.js'
import pdfRouter from './routes/pdf.routes.js'

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

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/agent" , agentRouter)
app.use("/api/v1/pdf" , pdfRouter)

export {app}