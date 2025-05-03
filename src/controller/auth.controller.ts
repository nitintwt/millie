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

  const scopes = ['https://mail.google.com/',"https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events",   "https://www.googleapis.com/auth/userinfo.email","https://www.googleapis.com/auth/userinfo.profile"]
  const url = oauth2Client.generateAuthUrl({
    access_type:"offline",
    scope:scopes
  })
  res.redirect(url)
}

const googleLogin = async (req:Request , res:Response)=>{
  const code = req.query.code as string
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
   )

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    })
    const { data } = await oauth2.userinfo.get();
    const {name , email} = data

    let user = await User.findOne({ email });

    if (user) {
      await User.findOneAndUpdate({ email }, { googleTokens: JSON.stringify(tokens) });
    } else {
      user = await User.create({
        fullName: name,
        email,
        googleTokens: JSON.stringify(tokens),
      });
    }

   return res.status(200)
   .json(new ApiResponse (200 , {userId:user._id} , 'Login successfull!!'))
  } catch (error:any) {
    console.error("google error",error)
    return res.status(500).json({message:"Something went wrong while google login. Try again"})
  }
}

const notionLogin = async (req:Request , res:Response)=>{
  const {code} = req.query
  const {userId} =req.body 

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${encoded}`,
    },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    })
    const ress = await response.json()
    console.log("notion",ress)

    const user = await User.findByIdAndUpdate(userId ,{
      notionTokens: ress.access_token
    })

    if(!user){
      return res.status(404).json(
        {message:"User not found"}
      )
    }

    return res.status(200).json(new ApiResponse (200 , 'Notion login successfull!!'))
  } catch (error) {
    console.error("notion error",error)
    return res.status(500).json({message:"Something went wrong while notion login. Try again"})
  }
}

export {googleAuth , googleLogin , notionLogin}