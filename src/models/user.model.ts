import mongoose, {Schema} from "mongoose";

const userSchema = new Schema(
  {
    fullName:{
      type : String,
    },
    refreshToken:{
        type:String
    },
    email:{
      type : String,
      unique:true,
      index: true
    },
    googleTokens:{
      type:String,
    },
    notionTokens:{
      type:String
    },
    notionDB:{
      type:String
    }
  },
  {
    timestamps: true
  }
)

export const User = mongoose.model("User" , userSchema)