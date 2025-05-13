/*This is the lambda function which will :-
1. download the pdf locally
2. chunk the pdf
3. call the openai embedding model for every chunk
4. store the chunk in qdrant db
*/

import AWS from 'aws-sdk';
import fs from 'fs';
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import {PDFLoader} from '@langchain/community/document_loaders/fs/pdf'

const s3 = new AWS.S3({
  accessKeyId: '',
  secretAccessKey: '',
  region: 'ap-south-1',
})

export const handler = async(event)=>{
  try {
    console.log('S3 Event:', JSON.stringify(event, null, 2));

    // get the bucket name from which the triggered has happened
    const bucket = event.Records[0].s3.bucket.name;
    
    // the file-name/key  due to which the triggered has happened
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file from bucket: ${bucket}, key: ${key}`);

    // Download video from S3
    const inputFile = `/tmp/${key.split('/').pop()}`;
    await downloadFromS3(bucket, key, inputFile);
    // Load and chunk PDF
    const loader = new PDFLoader(inputFile);
    const docs = await loader.load();

    const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small", apiKey: process.env.OPENAI_KEY });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings, 
      {
        url: 'https://b4f28916-d2e5-4ecb-bd2f-ffa783f9c1e4.eu-west-2-0.aws.cloud.qdrant.io:6333',
        apiKey: '',
        collectionName:"pdf-docs"
      }
    )

    await vectorStore.addDocuments(docs)

    //delete the pdf file from tmp
    await fs.promises.unlink(inputFile);

    return {
      statusCode: 200,
      body: 'PDF processed and embedded successfully.',
    };
  } catch (error) {
        console.error('Error processing pdf:', error);
    return {
      statusCode: 500,
      body: 'Error processing pdf.',
    }
  }
}

// Helper function to download pdf from S3 and store it in lambda function temp memory
async function downloadFromS3(bucket, key, destinationPath) {
  const params = { Bucket: bucket, Key: key };
  const fileStream = fs.createWriteStream(destinationPath);

  return new Promise((resolve, reject) => {
    s3.getObject(params)
      .createReadStream() // fetches the file from S3 as a readable stream.
      .on('error', reject)
      .pipe(fileStream) // writes the stream data to the local file
      .on('close', resolve);
  })
}