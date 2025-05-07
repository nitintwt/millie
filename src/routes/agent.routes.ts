import { reActAgent } from "../controller/agent.controller.js"
import {Router} from "express"

const agentRouter = Router()

agentRouter.route("/chat").post(reActAgent)

export default agentRouter