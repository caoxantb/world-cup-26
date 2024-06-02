import mongoose from "mongoose";
import { z } from "zod";

const userValidator = z.object({
  googleId: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  picture: z.string().url(),
  passwordHash: z.string().optional(),
  gameplay: z.array(z.instanceof(mongoose.Schema.Types.ObjectId)),
});

type IUser = z.infer<typeof userValidator>;

const userSchema = new mongoose.Schema<IUser>({
  googleId: String,
  name: String,
  email: String,
  picture: {
    type: String,
    default:
      "https://st3.depositphotos.com/1767687/16607/v/450/depositphotos_166074422-stock-illustration-default-avatar-profile-icon-grey.jpg",
  },
  passwordHash: String,
  gameplay: [mongoose.Schema.Types.ObjectId],
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.passwordHash;
  },
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;