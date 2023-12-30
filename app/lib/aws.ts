import { S3, CloudFront, DynamoDB, config } from "aws-sdk";
import { CLOUDFRONT_ID } from "@/app/config";

const region = "ap-northeast-1";
const s3BucketName = "hatebu-galaxy";
const dynamoTableName = "hatebu-galaxy";

config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: region,
});

const s3 = new S3();
const cloudfront = new CloudFront();
const docClient = new DynamoDB.DocumentClient({});

/**
 * S3バケット内のオブジェクトリストを取得する
 * @param prefix バケット内のパス
 */
export async function listS3Objects(prefix: string = "") {
  const params: S3.ListObjectsV2Request = { Bucket: s3BucketName, Prefix: prefix };
  const response = await s3.listObjectsV2(params).promise();
  return response.Contents;
}

/**
 * S3からデータをダウンロードする
 * @param key バケット内のオブジェクトのパス
 */
export async function downloadFromS3(key: string): Promise<any> {
  const params: S3.GetObjectRequest = { Bucket: s3BucketName, Key: key };

  return new Promise((resolve, reject) => {
    s3.getObject(params, (err, data) => {
      if (err) {
        console.error("File download error:", key);
        reject(err);
      } else {
        console.log("File download successfully:", key);
        const json = data.Body?.toString();
        if (json) {
          resolve(JSON.parse(json));
        }
        reject(`File body undefined: ${key}`);
      }
    });
  });
}

/**
 * S3にデータをアップロードする
 * @param key バケット内のオブジェクトのパス
 * @param data アップロードするjsonオブジェクト
 */
export async function uploadToS3(key: string, data: object | null = null) {
  const jsonString = data === null ? "" : JSON.stringify(data, null, 2);
  const params: S3.PutObjectRequest = {
    Bucket: s3BucketName,
    Key: key,
    Body: jsonString,
    CacheControl: "max-age=86400",
    ContentType: "application/json",
  };

  return new Promise((resolve, reject) => {
    s3.putObject(params, err => {
      if (err) {
        console.error(err, err.stack);
        reject(err);
      } else {
        console.log("File upload successfully:", key);
        resolve(true);
      }
    });
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

export function putItemToDynamo(key: string, value: any) {
  const params = {
    TableName: dynamoTableName,
    Item: {
      username: key,
      firstBookmarkCreated: value,
    },
  };

  docClient.put(params, (err, data) => {
    if (err) {
      console.error("Error putting item:", err);
    } else {
      console.log("Item put successful:", data);
    }
  });
}

export async function getItemFromDynamo(key: string): Promise<any> {
  const params = {
    TableName: dynamoTableName,
    Key: { username: key },
  };

  return new Promise((resolve, reject) => {
    docClient.get(params, (err, data) => {
      if (err) {
        console.error("Error getting item:", err);
        reject(err);
      } else {
        console.log("Item get successful:", data);
        resolve(data);
      }
    });
  });
}
