import type { ExampleImagePayload, ExampleImageRecord, ExampleImageSource, ExampleImageUsage } from "../types/image";

const DATABASE_NAME = "prompt-assets";
const STORE_NAME = "example-images";
const DATABASE_VERSION = 1;
export const EXAMPLE_IMAGE_LIMIT_BYTES = 30 * 1024 * 1024;
const MAX_TRANSFER_BYTES = 20 * 1024 * 1024;

interface StoredExampleImage extends ExampleImageRecord {
  blob: Blob;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("图片数据库操作失败。"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("图片数据库事务失败。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("图片数据库事务已取消。"));
  });
}

async function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("promptId", "promptId", { unique: false });
      store.createIndex("contentHash", "contentHash", { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开图片数据库。"));
  });
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i.exec(dataUrl);
  if (!match) throw new Error("图片传输格式无效，仅支持 JPG、PNG 和 WebP。");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { blob: new Blob([bytes], { type: match[1].toLowerCase() }), bytes };
}

async function blobToDataUrl(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

async function hashBytes(bytes: Uint8Array) {
  const buffer = new Uint8Array(bytes).buffer as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getAllStored() {
  const database = await openDatabase();
  try {
    return await requestResult(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll()) as StoredExampleImage[];
  } finally {
    database.close();
  }
}

export async function getExampleImageUsage(): Promise<ExampleImageUsage> {
  const images = await getAllStored();
  return {
    usedBytes: images.reduce((total, image) => total + image.byteSize, 0),
    limitBytes: EXAMPLE_IMAGE_LIMIT_BYTES,
    imageCount: images.length
  };
}

export async function putExampleImage(input: {
  promptId: string;
  dataUrl: string;
  width: number;
  height: number;
  source: ExampleImageSource;
  sortOrder: number;
  replaceImageId?: string;
}) {
  const { blob, bytes } = parseDataUrl(input.dataUrl);
  const contentHash = await hashBytes(bytes);
  const existing = await getAllStored();
  const duplicate = existing.find((image) => image.promptId === input.promptId && image.contentHash === contentHash);
  if (duplicate) return { image: withoutBlob(duplicate), duplicate: true };

  const replacedBytes = existing.find((image) => image.id === input.replaceImageId)?.byteSize ?? 0;
  const usedBytes = existing.reduce((total, image) => total + image.byteSize, 0) - replacedBytes;
  if (usedBytes + blob.size > EXAMPLE_IMAGE_LIMIT_BYTES) {
    throw new Error("示例图存储已达到 30MB 上限，请先管理或替换已有图片。");
  }

  const image: StoredExampleImage = {
    id: crypto.randomUUID(), promptId: input.promptId, blob, mimeType: blob.type,
    width: input.width, height: input.height, byteSize: blob.size, source: input.source,
    createdAt: Date.now(), sortOrder: input.sortOrder, contentHash
  };
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(image);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
  return { image: withoutBlob(image), duplicate: false };
}

function withoutBlob(image: StoredExampleImage): ExampleImageRecord {
  const { blob: _blob, ...metadata } = image;
  return metadata;
}

export async function getExampleImage(imageId: string): Promise<ExampleImagePayload | null> {
  const database = await openDatabase();
  try {
    const image = await requestResult(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(imageId)) as StoredExampleImage | undefined;
    return image ? { ...withoutBlob(image), dataUrl: await blobToDataUrl(image.blob) } : null;
  } finally {
    database.close();
  }
}

export async function deleteExampleImage(imageId: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(imageId);
    await transactionDone(transaction);
  } finally { database.close(); }
}

export async function deletePromptExampleImages(promptId: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const index = transaction.objectStore(STORE_NAME).index("promptId");
    const keys = await requestResult(index.getAllKeys(promptId));
    for (const key of keys) transaction.objectStore(STORE_NAME).delete(key);
    await transactionDone(transaction);
    return keys.length;
  } finally { database.close(); }
}

export async function cleanupOrphanExampleImages(validPromptIds: string[]) {
  const valid = new Set(validPromptIds);
  const images = await getAllStored();
  const orphanIds = images.filter((image) => !valid.has(image.promptId)).map((image) => image.id);
  for (const id of orphanIds) await deleteExampleImage(id);
  return orphanIds.length;
}

export async function fetchImageAsDataUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) throw new Error("只能获取 HTTP 或 HTTPS 图片。");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`图片获取失败（HTTP ${response.status}）。`);
  const blob = await response.blob();
  if (!/^image\/(jpeg|png|webp)$/i.test(blob.type)) throw new Error("远程内容不是受支持的图片格式。");
  if (blob.size > MAX_TRANSFER_BYTES) throw new Error("图片超过 20MB，无法作为示例图处理。");
  return blobToDataUrl(blob);
}
