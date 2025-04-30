import mongoose, {Schema} from "mongoose";

const userSchema = new Schema(
  {
    fullName:{
      type : String,
    },
    password:{
      type:String
    },
    refreshToken:{
        type:String
    },
    userName:{
      type : String,
      unique: true,
      default: null,
    },
    email:{
      type : String,
      unique:true,
      index: true
    },
    tokens:{
      type:String,
    },
  },
  {
    timestamps: true
  }
)

export const User = mongoose.model("User" , userSchema)