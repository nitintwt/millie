process.env.GROQ_API_KEY = "";

import { HumanMessage, AIMessage } from "@langchain/core/messages";
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
import { StructuredTool } from "@langchain/core/tools";
import { Calculator } from "@langchain/community/tools/calculator";
import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from "@langchain/community/tools/google_calendar";

const gmailParams = {
  credentials: {
    accessToken: "",
  },
  scopes: ["https://mail.google.com/"], 
};

const googleCalendarParams = {
  credentials: {
    clientEmail: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_CALENDAR_PRIVATE_KEY,
    calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID,
  },
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ],
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
];

const toolNode = new ToolNode(tools);

const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
}).bindTools(tools);

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);

  return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

const app = workflow.compile();

const finalState = await app.invoke({
  messages: [new HumanMessage("Could you search in my drafts for the latest email?")],
});
console.log(finalState.messages[finalState.messages.length - 1].content);

