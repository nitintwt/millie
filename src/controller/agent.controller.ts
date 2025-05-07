import { HumanMessage } from "@langchain/core/messages"
import agent from "../agent.js"
import {Request , Response} from 'express'
import { z } from "zod"
import mongoose from "mongoose";

const inputSchema = z.object({
  input:z.string(),
  userId:z.string().refine((id)=> mongoose.isValidObjectId(id), {message: "Invalid slot ID"}),
})

const reActAgent = async(req:Request , res:Response)=>{
  const parseResult = inputSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json(
      {message: parseResult.error.issues[0].message }
    )
  }
  const {input , userId} = parseResult.data
  try {
    const millie = await agent(userId)
    const response = await millie.invoke({messages:[new HumanMessage(input)]},{configurable:{thread_id:userId}})
    console.log(response.messages[response.messages.length - 1].content);
    return res.status(200).json({message:response.messages[response.messages.length - 1].content})
  } catch (error) {
    console.log("Something went wrong while executing your task" , error)
    return res.status(500).json({message:"Something went wrong while executing your task"})
  }
}

export {reActAgent}