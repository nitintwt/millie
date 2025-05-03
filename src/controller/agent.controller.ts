import { HumanMessage } from "@langchain/core/messages"
import agent from "../agent"
import {Request , Response} from 'express'


const reActAgent = async(req:Request , res:Response)=>{
  const {input , userId} = req.body 
  try {
    const response = await agent.invoke({messages:[new HumanMessage(input)]},{configurable:{thread_id:userId}})
    console.log(response.messages[response.messages.length - 1].content);
    return res.status(200).json({message:response.messages[response.messages.length - 1].content})
  } catch (error) {
    console.log("Something went wrong while executing your task" , error)
    return res.status(500).json({message:"Something went wrong while executing your task"})
  }
}

export {reActAgent}