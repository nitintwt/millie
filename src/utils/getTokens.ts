import { google } from "googleapis";
import { User } from "../models/user.model.js";

const cache = new Map();

/*
what's the logic here ?
to execute different tools , like gmail , calendar or notion, we need access token which we got after auth.
there are two problem :
1. access token gets expired after every 1hr
2. fethching access token from db for every request can deplay response and increase db bill\

To solve these issues , I have wrote this logic:

First , I check is there any cached value available ?
if (yes){
 Then , I first check its expiry date , is it after 5 minutes  if yes then I refresh th access token , save it to db and cache it. then return googleToken and notionToken to user
 } else{
  fetch the token from db , check its expiry date
  if(expired){
    refresh the access token, save it to db  , cache it and then return to user
  } else {
    cache it and return to user 
  }
 }
*/

const getTokens = async (userId) => {
  const cached = cache.get(userId);

  const isTokenExpired = (token) => !token.expiry_date || token.expiry_date <= Date.now() + 5 * 60 * 1000;

  const refreshTokens = async (token) => {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URL
    );
    oauth2Client.setCredentials(token);

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const updatedToken = {
        ...token,
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      };
      await User.findByIdAndUpdate(userId, {
        googleTokens: JSON.stringify(updatedToken),
      });
      return updatedToken;
    } catch (err) {
      console.error("Error refreshing Google access token:", err);
      throw err;
    }
  };

  if (cached) {
    const { googleToken, notionToken } = cached;
    if (!isTokenExpired(googleToken)) {
      return { googleToken, notionToken };
    }
    const refreshedToken = await refreshTokens(googleToken);
    cache.set(userId, { googleToken: refreshedToken, notionToken });
    return { googleToken: refreshedToken, notionToken };
  }

  //not cached 
  const user = await User.findById(userId);
  let googleToken = JSON.parse(user.googleTokens);
  const notionToken = user.notionTokens;

  if (isTokenExpired(googleToken) && googleToken.refresh_token) {
    googleToken = await refreshTokens(googleToken);
  }

  cache.set(userId, { googleToken, notionToken });
  return { googleToken, notionToken };
};

export default getTokens;
