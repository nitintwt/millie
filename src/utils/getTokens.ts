import { User } from "../models/user.model"

const cache = new Map()

const getTokens = async (userId)=>{
  const token = cache.get(userId)

  const user = await User.findById(userId)
  const googleToken = JSON.parse(user.googleTokens);
  const notionToken = user.notionTokens

  cache.set(userId, {tokens:googleToken , notionToken})

  return {googleToken , notionToken}
}

export default getTokens