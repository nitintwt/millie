import { Router } from "express";
import { googleAuth , googleLogin, notionLogin} from "../controller/auth.controller.js"

const authRouter = Router()

authRouter.route("/googleOAuth").get(googleAuth)
authRouter.route("/googleLogin").post( googleLogin)
authRouter.route("/notionLogin").post(notionLogin)

export default authRouter