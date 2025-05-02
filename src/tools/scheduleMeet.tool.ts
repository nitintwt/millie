import { google } from "googleapis";
import { StructuredTool , DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

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
        sendUpdates: "all",
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
      console.log("Created Event:", JSON.stringify(event.data));
      return `Meeting scheduled successfully with ${attendename} on ${date} at ${startTime}. Here is the meeting link : ${event.data.hangoutLink}`;
    } catch (error) {
      return `Error scheduling meeting: ${error}`;
    }
  }
});

export default scheduleMeetingTool