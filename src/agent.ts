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
import { MemorySaver } from "@langchain/langgraph";


const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
})

const gmailParams = {
  credentials: {
    accessToken: "",
  },
  scopes: ["https://mail.google.com/"], 
};

const googleCalendarParams = {
  credentials: {
    accessToken: "",
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
];

const toolNode = new ToolNode(tools);
const boundModel = model.bindTools(tools);
const memory = new MemorySaver();

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;
  return lastMessage.tool_calls?.length ? "tools" : "__end__";
}

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await boundModel.invoke(state.messages);
  return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

const app = workflow.compile({checkpointer:memory});

const finalState = await app.invoke({
  messages: [new HumanMessage("schedule a meeting with nitinsingh2368@gmail.com regarding the project we are going to work on from monday")],
});
console.log(finalState.messages[finalState.messages.length - 1].content);

