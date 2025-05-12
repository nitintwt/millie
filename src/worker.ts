import { Worker } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import {PDFLoader} from '@langchain/community/document_loaders/fs/pdf'
import {CharacterTextSplitter} from '@langchain/textsplitters'
import { QdrantClient } from "@qdrant/js-client-rest";
/*

Steps:
1. read the pdf from path 
2. chunk the pdf
3. call the openai embedding model for every chunk
4. store the chunk in qdrant db
*/

const worker = new Worker('file-upload-queue', async(job)=>{
  console.log("job", job.data)
  const data = JSON.parse(job.data)

  const loader = new PDFLoader(data.path)
  const docs = await loader.load()

  /*const textsplitter = new CharacterTextSplitter({
    chunkSize:100,
    chunkOverlap:0
  })

  const texts = await textsplitter.splitText(docs)
  console.log(texts)*/

  const embeddings = new OpenAIEmbeddings({model:"text-embedding-3-small" ,apiKey:process.env.OPENAI_KEY})

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings, 
    {
      url:"http://localhost:6333",
      collectionName:"pdf-docs"
    }
  )

  await vectorStore.addDocuments(docs)
 },
 {concurrency:100, 
  connection:{
  host:"localhost",
  port:6379
 }}
)