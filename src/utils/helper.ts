import { v2 as cloudinary } from "cloudinary";
import vonage from "./smsProvider";

export async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (item) => {
    const b64 = Buffer.from(item.buffer).toString("base64");
    let dataUri = "data:" + item.mimetype + ";base64," + b64;
    const res = await cloudinary.uploader.upload(dataUri);
    return res.url;
  });
  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

export const generateOTP = (otp_length = 6) => {
  // Declare a digits variable
  // which stores all digits
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < otp_length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

export const sendSms = (mobile: string, sms: string) => {
  vonage.sms
    .send({ to: mobile, from: "Fanbuzz", text: sms })
    .then((resp) => {
      console.log("Message sent successfully");
      console.log(resp);
    })
    .catch((err) => {
      console.log("There was an error sending the messages.", err);
    });
};
