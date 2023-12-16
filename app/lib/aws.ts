import { S3 } from "aws-sdk";

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "ap-northeast-1",
});

export function uploadS3(key: string, data: object) {
  const jsonString = JSON.stringify(data, null, 2);
  const params = { Bucket: "hatebu-galaxy", Key: key, Body: jsonString };

  s3.putObject(params, err => {
    console.log("File uploaded successfully:");
  });
}
