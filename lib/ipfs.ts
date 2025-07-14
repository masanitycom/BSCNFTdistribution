import axios from "axios";

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

interface PinataMetadata {
  name: string;
  keyvalues?: Record<string, any>;
}

export async function uploadToIPFS(
  file: File | Blob,
  metadata: PinataMetadata
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pinataMetadata", JSON.stringify(metadata));

  try {
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error("IPFSへのアップロードに失敗しました");
  }
}

export async function uploadJSONToIPFS(
  json: any,
  metadata: PinataMetadata
): Promise<string> {
  try {
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      {
        pinataContent: json,
        pinataMetadata: metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("IPFS JSON upload error:", error);
    throw new Error("JSONのIPFSアップロードに失敗しました");
  }
}

export function getIPFSUrl(hash: string): string {
  return `${PINATA_GATEWAY}/${hash}`;
}

export function getIPFSProtocolUrl(hash: string): string {
  return `ipfs://${hash}`;
}