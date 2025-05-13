import {GetObjectCommand, S3Client , PutObjectCommand } from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import dotenv from "dotenv"

dotenv.config({
  path:'./.env'
})

const s3Client = new S3Client({
  region:"ap-south-1",
  credentials:{
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
  }
})

//AWS S3 bucket 
const putObjectUrlForPdfUpload = async (req , res)=>{
  const {fileName , contentType} = req.query
  console.log(fileName , contentType)
  const command = new PutObjectCommand({
    Bucket:"millie-pdf",
    Key:`${fileName}`,
    ContentType:contentType
  })
  const url = await getSignedUrl(s3Client , command)
  return res.status(200).json({message: url})
}

export {putObjectUrlForPdfUpload}