// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import nextConnect from 'next-connect';
import multer from 'multer'
import fs, { promises as fsPromise } from 'fs'
import { FormRecognizerClient, AzureKeyCredential } from "@azure/ai-form-recognizer"

const endpoint = "https://lbs-form-recog.cognitiveservices.azure.com/"
const apiKey = process.env.FORM_RECOG_API_KEY
const client = new FormRecognizerClient(endpoint, new AzureKeyCredential(apiKey));

const apiRoute = nextConnect({
  onError(error, req, res) {
    console.log(error)
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

const uploadMiddleware = upload.single('pdf-file');
apiRoute.use(uploadMiddleware);

apiRoute.post(async (req, res) => {
  try {
    const filePath = req.file.path
    const readStream = fs.createReadStream(filePath)

    const poller = await client.beginRecognizeContent(readStream, "application/pdf", {
      onProgress: (state) => { console.log(`status: ${state.status}`) }
    })

    const pages = await poller.pollUntilDone()

    if (!pages || pages.length === 0) {
      throw new Error("Expecting non-empty list of pages!");
    }

    await fsPromise.unlink(req.file.path)

    let data = pages.map(p => ({ tables: p.tables.map(t => ({ cells: t.cells.map(c => ({ pageNumber: c.pageNumber, rowIndex: c.rowIndex, columnIndex: c.columnIndex, text: c.text })) })) }))

    const printOutTables = []

    data.forEach(p => p.tables.forEach(t => t.cells.forEach(c => {
      let { pageNumber, rowIndex, columnIndex, text } = c
      pageNumber = pageNumber - 1

      printOutTables[pageNumber] ? null : printOutTables[pageNumber] = []
      printOutTables[pageNumber][rowIndex] ? null : printOutTables[pageNumber][rowIndex] = []
      printOutTables[pageNumber][rowIndex][columnIndex] = text
    })))

    const result = printOutTables.map((p, i) => p.map(e => e.join("|||")).join("\n"))
    res.status(200).json({ result })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
});

export default apiRoute;


export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};
