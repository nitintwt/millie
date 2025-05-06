import {Client} from '@notionhq/client'
import { StructuredTool , DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const addToNotionPage = async (accessToken)=>{
  return new DynamicStructuredTool({
    name:"add_to_notion_page",
    description:"Can add something in a specific notion page",
    schema: z.object({
        pageTitle:z.string(),
        contentToAdd:z.string()
    }),
    async func ({pageTitle , contentToAdd})  {
        const notion = new Client({ auth: accessToken });
        // Step 1: Search page
        const res = await notion.search({ query: pageTitle, filter: { value: "page", property: "object" } });
        if (!res.results.length) return `Page "${pageTitle}" not found.`;
        const pageId = res.results[0].id;
        // Step 2: Append block children
        await notion.blocks.children.append({
            block_id: pageId,
            children: [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: contentToAdd } }] } }]
        });
        return `Added to page "${pageTitle}".`;
    }
})}

const createNewNotionPage = async (accessToken)=>{
  return new DynamicStructuredTool({
  name:"create_new_page_in_notion",
  description:" create a new page in notion",
  schema: z.object({
    pageTitle:z.string(),
    pageContent:z.string()
  }),
  async func ({pageTitle , pageContent}) {
    const notion = new Client({ auth: accessToken });
    const databaseId=""
    try {
      const response = await notion.pages.create({
        parent:{
          database_id:databaseId
        },
        properties:{
          Name:{
            title:[
              {
                text:{
                  content:pageTitle
                }
              }
            ]
          },
          Content:{
              rich_text: [
                {
                  text: {
                    content: pageContent,
                  },
                },
              ],
            },
          }
      })
      return `Page titled "${pageTitle}" created successfully`;
    } catch (error) {
      console.error("Notion page creation failed:", error);
      return "Something went wrong. Please try again after some time.";
    } 
  }
})}

export {addToNotionPage , createNewNotionPage}

