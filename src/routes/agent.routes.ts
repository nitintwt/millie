import { reActAgent } from "../controller/agent.controller"
import {Router} from "express"

const agentRouter = Router()

agentRouter.route("/chat").post(reActAgent)

export default agentRouter