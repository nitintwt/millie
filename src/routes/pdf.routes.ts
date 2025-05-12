import { uploadPdf } from '../controller/pdf.controller.js'
import {Router} from 'express'

const pdfRouter = Router()

pdfRouter.route("/upload/pdf").post(uploadPdf)

export default pdfRouter