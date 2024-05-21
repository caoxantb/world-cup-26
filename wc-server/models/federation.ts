import mongoose from "mongoose";
import { z } from "zod";

const federationValidator = z.object({
  name: z.string(),
  code: z.string(),
  logo: z.string().url(),
  rounds: z.array(z.string()),
});

type IFederation = z.infer<typeof federationValidator>;

const federationSchema = new mongoose.Schema<IFederation>({
  name: String,
  code: String,
  logo: String,
  rounds: [String],
});

const Federation = mongoose.model<IFederation>("Federation", federationSchema);

export default Federation;
