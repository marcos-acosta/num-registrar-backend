import mongoose from "mongoose";

const user = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minLength: 1
  },
  facebookId: {type: String, required: true},
  color: {type: String, required: true},
  number: {type: Number, required: true},
  message: {type: String, required: false},
});

export default mongoose.model("User", user);