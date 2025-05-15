import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const pdfDataRetriever = async ()=>{
  return new DynamicStructuredTool({
    name:"pdfDataRetriever",
    description:"It retrieves pdf data from qdrant db based on user query",
    schema:z.object({
      userQuery:z.string()
    }),
    async func ({userQuery}){
      try {
        const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small", apiKey: process.env.OPENAI_KEY });

        const vectorStore = await QdrantVectorStore.fromExistingCollection(
          embeddings, 
          {
            url: 'https://b4f28916-d2e5-4ecb-bd2f-ffa783f9c1e4.eu-west-2-0.aws.cloud.qdrant.io:6333',
            apiKey: '',
            collectionName:"pdf-docs"
          }
        )
        const ret = vectorStore.asRetriever({k:2})
        const result = await ret.invoke(userQuery)

        console.log("response" , result)
        return result
      } catch (error) {
        return "Something went wrong while fetching pdf data from qdrant db"
      }
    }
  })
}

export default pdfDataRetriever