import { google } from "googleapis";
import { Request, Response } from "express";
import { User } from "../models/user.model"
import { ApiResponse } from "../utils/ApiResponse";

const googleAuth =async (req:Request , res:Response)=>{
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  const scopes = ['https://mail.google.com/',"https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"]
  const url = oauth2Client.generateAuthUrl({
    access_type:"offline",
    scope:scopes
  })

  res.redirect(url)

}

const googleLogin = async (req:Request , res:Response)=>{
  const code = req.query.code as string
  const userId ="" 

  const oauth2Client = new google.auth.OAuth2(
   process.env.CLIENT_ID,
   process.env.CLIENT_SECRET,
   process.env.REDIRECT_URL
  )

  try {
   const { tokens } = await oauth2Client.getToken(code); 
   oauth2Client.setCredentials(tokens);

   const user = await User.findByIdAndUpdate(userId ,{
    tokens: JSON.stringify(tokens)
  })

  if(!user){
    return res.status(404).json(
      {message:"User not found"}
    )
  }

   return res.status(200)
   .json(new ApiResponse (200 , 'Login successfull!!'))
  } catch (error:any) {
    console.error(error)
    return res.status(500).json({message:"Something went wrong. Try again"})
  }
}

export {googleAuth , googleLogin}