import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import {
  GmailCreateDraft,
  GmailGetMessage,
  GmailGetThread,
  GmailSearch,
  GmailSendMessage,
} from "@langchain/community/tools/gmail";
import { Calculator } from "@langchain/community/tools/calculator";
import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from "@langchain/community/tools/google_calendar";
import { MemorySaver } from "@langchain/langgraph";
import scheduleMeetingTool from "./tools/scheduleMeet.tool.js";
import { addToNotionPage , createNewNotionPage} from "./tools/notion.tool.js";
import { User } from "./models/user.model.js";
import getTokens from "./utils/getTokens.js";
import pdfDataRetriever from "./tools/pdfDataRetriever.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

const chainClassifierPrompt = ChatPromptTemplate.fromTemplate(
  `Classify the user question as either "PDF" or "General".
  If the question is about searching, summarizing, or extracting from a PDF, respond with "PDF".Otherwise, respond with "General".`
)

const chainClassifier = RunnableSequence.from([
  chainClassifierPrompt,
  new ChatGroq({
    model: "llama-3-8b-8192",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
  }),
  new StringOutputParser(),
])


const agent = async(userId)=>{
  const {googleToken , notionToken}= await getTokens(userId)
  const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    maxRetries: 2,
    maxTokens:750,
    apiKey:process.env.GROQ_API_KEY
  })

  const gmailParams = {
    credentials: {
      accessToken:googleToken.access_token
    },
    scopes: ["https://mail.google.com/"], 
  };

  const googleCalendarParams = {
    credentials: {
      accessToken:googleToken.access_token,
      calendarId:"primary"
    },
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    model,
  };

  const tools= [
    new GmailCreateDraft(gmailParams),
    new GmailGetMessage(gmailParams),
    new GmailGetThread(gmailParams),
    new GmailSearch(gmailParams),
    new GmailSendMessage(gmailParams),
    new Calculator(),
    new GoogleCalendarCreateTool(googleCalendarParams),
    new GoogleCalendarViewTool(googleCalendarParams),
    await scheduleMeetingTool(googleToken),
    await addToNotionPage(notionToken),
  ];

  const toolNode = new ToolNode(tools);
  const boundModel = model.bindTools(tools);
  const memory = new MemorySaver();

  function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1] as AIMessage;
    return lastMessage.tool_calls?.length ? "tools" : "__end__";
  }

  const systemPrompt = new SystemMessage(`
  You are Millie, a professional AI assistant specialized in email ,  calendar and Notion workflows.  
  You are authoritative, concise, and error aware.  

  1. Identity & Tone:
    • You are Millie, the user's personal productivity AI.  
    • Tone: friendly, concise, confident.  
    • If uncertain, ask clarifying questions ,do not guess.  

  2. Tools & Schemas:
    • Gmail tools:
      - Search: Use to find emails using natural language (e.g., sender, subject).
        Input schema: { query: string }
        Example: { query: "from:example@gmail.com" }
      - GetMessage: Use to get full content of a message. Needs { messageId }.
      - GetThread: Use to fetch all messages in a conversation. Needs { threadId }.
      - CreateDraft: Use to compose an email.
      - SendMessage: Use to send a composed message.
    • Calendar tools: ViewEvents, CreateEvent (includes Meet link).  
    • Custom: scheduleMeetingTool with schema:
      {
        userEmail: string (email),
        attendename: string,
        attendeEmail: string (email),
        date: \"YYYY-MM-DD\",
        startTime: \"HH:MM\",
        endTime: \"HH:MM\",
        summary: string,
        description: string
      }
    • Notion: addToNotionPage tool with schema:
        {
          pageTitle: string,
          contentToAdd: string            
        }

  3. Execution Flow:
    a. Read user query.  
    b. If tool required:
        • Validate all fields against schema.  
        • If fields missing, ask user specifically.  
        • Call tool with exact JSON.
    c. If scheduling a meeting:
        i. Use scheduleMeetingTool to confirm participants and finalize details.
        ii. Then, call GoogleCalendarCreateTool with meeting details to create calendar event.  
    d. On tool success: confirm action with concise summary and any links.  
    e. On tool failure: inform user: “Something went wrong.Please try again after some time.”  

  4. Context & Memory:
    • Maintain conversation history to resolve pronouns (“this”, “that email”).

  5. Constraints:
    • Always schedule in IST (Asia/Kolkata) unless user overrides.  
    • Never expose internal tokens or stack traces.  
    • Do not hallucinate data , use only user provided or tool retrieved info. `);

  async function callModel(state: typeof MessagesAnnotation.State) {
    const response = await boundModel.invoke(state.messages, {
      configurable: {
        prefixMessages: [systemPrompt],
      },
    });
    return { messages: [response] };
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addNode("tools", toolNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

  async function mainRouter({ messages }, {configurable}) {
    const lastUserMsg = messages.filter(m => m instanceof HumanMessage).pop();
    const question = lastUserMsg?.content || "";
    const classification = await chainClassifier.invoke({ question });
    if (classification.trim().toLowerCase() === "pdf") {
      const docs = await pdfDataRetriever(question)
      const prompt = `You are Millie , a PDF assistant. Answer the user's question using the using the pdf data which has been provided. Data:- ${JSON.stringify(docs)}`
      const model = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        maxRetries: 2,
        maxTokens:750,
        apiKey:process.env.GROQ_API_KEY,
      })
      const response = await model.invoke(question, {
        configurable:{
          prefixMessages:[prompt]
        }
      })
      return {response , docs}
    } else {
      return await workflow.compile({ checkpointer: memory }).invoke({ messages }, configurable);
    }
  }

  return {
    invoke: mainRouter,
  };
}

export default agent
