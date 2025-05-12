import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.routes.js'
import agentRouter from './routes/agent.routes.js'
import pdfRouter from './routes/pdf.routes.js'
import multer from 'multer'
import { Queue } from 'bullmq'

const queue = new Queue("file-upload-queue", {
  connection:{
  host:"localhost",
  port:6379
 }
})


const storage = multer.diskStorage({
  destination: function (req , file , cb){
    cb(null , "uploads/")
  },
  filename: function(req , file , cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() *1e9)
    cb(null , `${uniqueSuffix}-${file.originalname}`)
  }
})

const upload = multer({storage:storage})
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

app.post("/api/v1/upload/pdf" ,upload.single('pdf'), (req , res)=>{
  queue.add(
    'file-ready',
    JSON.stringify({
      filename:req.file.originalname,
      destination:req.file.destination,
      path:req.file.path
    })
  )
  return res.json({mesage:"pdf has been uploaded"})
} )

export {app}