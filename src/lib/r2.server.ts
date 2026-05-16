import { S3Client } from "@aws-sdk/client-s3";
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type R2BucketKind = "masters" | "previews" | "normalized" | "artwork" | "exports";

export const R2_BUCKETS: Record<R2BucketKind, string> = {
  masters: "mrq-music-masters",
  previews: "mrq-music-previews",
  normalized: "mrq-music-normalized",
  artwork: "mrq-music-artwork",
  exports: "mrq-music-exports",
};

let _client: S3Client | null = null;

export function r2Client(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 is not configured (missing R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).");
  }
  _client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return _client;
}

export async function presignPut(bucket: string, key: string, contentType: string, expiresIn = 900) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(r2Client(), cmd, { expiresIn });
}

export async function presignGet(bucket: string, key: string, expiresIn = 900) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(r2Client(), cmd, { expiresIn });
}

export async function headObject(bucket: string, key: string) {
  const res = await r2Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    contentLength: Number(res.ContentLength ?? 0),
    contentType: res.ContentType ?? "application/octet-stream",
    etag: res.ETag ?? null,
  };
}

export function publicArtworkUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_ARTWORK_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}
