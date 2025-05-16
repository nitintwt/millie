import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const pdfDataRetriever = async (question)=>{
  try {
    const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small", apiKey: process.env.OPENAI_KEY });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings, 
      {
        url: 'https://b4f28916-d2e5-4ecb-bd2f-ffa783f9c1e4.eu-west-2-0.aws.cloud.qdrant.io:6333',
        apiKey: process.env.Qdrant_DB_API_KEY,
        collectionName:"pdf-docs"
      }
    )
    const ret = vectorStore.asRetriever({k:2})
    const result = await ret.invoke(question)

    return result
  } catch (error) {
    return "Something went wrong while fetching pdf data from qdrant db"
  }
}

export default pdfDataRetriever