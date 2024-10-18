import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";
import "dotenv/config";

const vonageAuth = new Auth({
  apiKey: process.env.VONAGE_API_KEY as string,
  apiSecret: process.env.VONAGE_API_SECRET as string,
});

const vonage = new Vonage(vonageAuth);

export default vonage;
