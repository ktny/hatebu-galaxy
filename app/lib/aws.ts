import { S3, CloudFront } from "aws-sdk";
import { CLOUDFRONT_ID } from "@/app/config";

const REGION = "ap-northeast-1";
const BUCKET = "hatebu-galaxy";

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: REGION,
});

const cloudfront = new CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

/**
 * S3バケット内のオブジェクトリストを取得する
 * @param prefix バケット内のパス
 */
export async function listS3Objects(prefix: string = "") {
  const params: AWS.S3.ListObjectsV2Request = { Bucket: BUCKET, Prefix: prefix };
  const response = await s3.listObjectsV2(params).promise();
  return response.Contents;
}

/**
 * S3にデータをアップロードする
 * @param key バケット内のオブジェクトのパス
 * @param data アップロードするjsonオブジェクト
 */
export function uploadS3(key: string, data: object) {
  const jsonString = JSON.stringify(data, null, 2);
  const params = { Bucket: BUCKET, Key: key, Body: jsonString };

  s3.putObject(params, err => {
    if (err) {
      console.error(err, err.stack);
    } else {
      console.log(`File uploaded successfully: ${key}`);
    }
  });
}

/**
 * CloudFrontの指定のパスのキャッシュを削除する
 * @param pathList
 */
export function invalidation(pathList: string[]) {
  const params = {
    DistributionId: CLOUDFRONT_ID,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: pathList.length,
        Items: pathList,
      },
    },
  };

  cloudfront.createInvalidation(params, err => {
    if (err) {
      console.error(err, err.stack);
    } else {
      console.log(`Create invaldation successfully`);
    }
  });
}
