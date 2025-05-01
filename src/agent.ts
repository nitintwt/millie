process.env.GROQ_API_KEY = "";

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
import { StructuredTool , DynamicStructuredTool } from "@langchain/core/tools";
import { Calculator } from "@langchain/community/tools/calculator";
import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from "@langchain/community/tools/google_calendar";
import { MemorySaver } from "@langchain/langgraph";
import { google } from "googleapis";
import { calendar_v3 } from "googleapis";
import { z } from "zod";


const model = new ChatGroq({
  model: "llama3-70b-8192",
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


const scheduleMeetingTool = new DynamicStructuredTool({
  name: "schedule_meeting",
  description: "Can schedule Google Meet meetings between two participants.",
  schema: z.object({
    userEmail: z.string().email(),
    attendename: z.string(),
    attendeEmail: z.string().email(),
    date: z.string().describe("Date in format YYYY-MM-DD"),
    startTime: z.string().describe("Start time in HH:mm (24h) format"),
    endTime: z.string().describe("End time in HH:mm (24h) format"),
    summary: z.string(),
    description: z.string()
  }),
  async func({
    userEmail,
    attendename,
    attendeEmail,
    date,
    startTime,
    endTime,
    summary,
    description,
  }) {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({
      access_token: "",
    });

    const calendar = google.calendar({ version: "v3", auth: authClient });

    try {
      const event = await calendar.events.insert({
        auth: authClient,
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
          summary,
          description,
          start: {
            dateTime: `${date}T${startTime}:00+05:30`,
            timeZone: "Asia/Kolkata",
          },
          end: {
            dateTime: `${date}T${endTime}:00+05:30`,
            timeZone: "Asia/Kolkata",
          },
          conferenceData: {
            createRequest: {
              requestId: String(Date.now()),
            },
          },
          attendees: [
            { email: userEmail },
            { email: attendeEmail },
          ],
        },
      });

      return `Meeting scheduled successfully with ${attendename} on ${date} at ${startTime}. Here is the meeting link : ${event.data.hangoutLink}`;
    } catch (error) {
      return `Error scheduling meeting: ${error}`;
    }
  }
});


const tools= [
  new GmailCreateDraft(gmailParams),
  new GmailGetMessage(gmailParams),
  new GmailGetThread(gmailParams),
  new GmailSearch(gmailParams),
  new GmailSendMessage(gmailParams),
  new Calculator(),
  new GoogleCalendarCreateTool(googleCalendarParams),
  new GoogleCalendarViewTool(googleCalendarParams),
  scheduleMeetingTool
];

const toolNode = new ToolNode(tools);
const boundModel = model.bindTools(tools);
const memory = new MemorySaver();

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;
  return lastMessage.tool_calls?.length ? "tools" : "__end__";
}

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await boundModel.invoke(state.messages );
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
  messages: [new HumanMessage("summarise the most recent email from nitinsingh2368@gmail.com. Then , send a reply to him accordingly")],
}, {configurable:{thread_id:'1'}});
console.log(finalState.messages[finalState.messages.length - 1].content);

console.log(finalState)

