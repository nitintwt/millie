import { putObjectUrlForPdfUpload } from '../controller/pdf.controller.js'
import {Router} from 'express'

const pdfRouter = Router()

pdfRouter.route("/putObjectUrl").get(putObjectUrlForPdfUpload)

export default pdfRouter