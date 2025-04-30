import { Router } from "express";
import { googleAuth , googleLogin} from "../controller/google.controller"

const googleRouter = Router()

googleRouter.route("/googleOAuth").get(googleAuth)
googleRouter.route("/googleLogin").post( googleLogin)

export default googleRouter