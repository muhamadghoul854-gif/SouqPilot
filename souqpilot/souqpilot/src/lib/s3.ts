import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.AWS_ENDPOINT_URL
    ? { endpoint: process.env.AWS_ENDPOINT_URL, forcePathStyle: true }
    : {}),
});

const BUCKET = process.env.S3_BUCKET_NAME!;
const EXPIRY_SECS = 3600; // 1 hour

const ALLOWED_TYPES = [
  "application/pdf",
  "application/zip",
  "application/epub+zip",
  "video/mp4",
  "application/octet-stream",
];

function inferContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    zip: "application/zip",
    epub: "application/epub+zip",
    mp4: "video/mp4",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}

/** Generate a 1-hour signed S3 download URL */
export async function generateSignedDownloadUrl(
  s3Key: string,
  filename: string,
  expirySeconds: number = EXPIRY_SECS
): Promise<{ url: string; expiresAt: Date }> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._\-\s]/g, "_");

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    ResponseContentDisposition: `attachment; filename="${safeFilename}"`,
    ResponseContentType: inferContentType(s3Key),
  });

  const url = await getSignedUrl(s3, command, { expiresIn: expirySeconds });
  return { url, expiresAt: new Date(Date.now() + expirySeconds * 1000) };
}

/** Generate a presigned POST URL for seller file uploads */
export async function generateUploadPresignedUrl(
  sellerId: string,
  contentType: string,
  maxSizeBytes = 2 * 1024 * 1024 * 1024
): Promise<{ uploadUrl: string; fields: Record<string, string>; s3Key: string }> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error(`Content-type not permitted: ${contentType}`);
  }

  const s3Key = `sellers/${sellerId}/products/${crypto.randomUUID()}`;

  const { url, fields } = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: s3Key,
    Conditions: [
      ["content-length-range", 1, maxSizeBytes],
      ["eq", "$Content-Type", contentType],
      ["eq", "$key", s3Key],
    ],
    Fields: {
      "Content-Type": contentType,
      "x-amz-server-side-encryption": "AES256",
    },
    Expires: 3600,
  });

  return { uploadUrl: url, fields, s3Key };
}

/** Verify a file exists in S3 after upload */
export async function verifyS3Object(
  s3Key: string
): Promise<{ contentType: string; fileSizeBytes: number }> {
  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  return {
    contentType: head.ContentType ?? "application/octet-stream",
    fileSizeBytes: head.ContentLength ?? 0,
  };
}

/** Hard-delete a file from S3 */
export async function deleteS3Object(s3Key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
}
