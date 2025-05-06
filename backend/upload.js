/* eslint-disable import/first */
const dotenv = require("dotenv");
const { File } = require("web3.storage");

dotenv.config();

let clientInstance = null; // Biến toàn cục để lưu trạng thái client

async function makeStorageClient() {
  if (clientInstance) {
    return clientInstance; // Trả về client đã được khởi tạo
  }

  const { create } = await import("@web3-storage/w3up-client");
  const { parse } = await import("@web3-storage/w3up-client/proof");
  const { Signer } = await import(
    "@web3-storage/w3up-client/principal/ed25519"
  );
  const { StoreMemory } = await import(
    "@web3-storage/w3up-client/stores/memory"
  );

  // Tạo client
  const principal = Signer.parse(process.env.WEB3_STORAGE_TOKEN);
  const store = new StoreMemory();
  const client = await create({ principal, store });
  console.log("Client created successfully.");

  // Lấy DID và proof từ biến môi trường
  const existingSpaceDid = process.env.W3UP_SPACE_DID;
  const proofBase64 = process.env.W3UP_PROOF;

  if (existingSpaceDid && proofBase64) {
    console.log("Setting existing space as current:", existingSpaceDid);

    try {
      // Giải mã proof và thêm vào client
      const proof = await parse(proofBase64);
      await client.addSpace(proof);

      // Thiết lập space hiện tại
      await client.setCurrentSpace(existingSpaceDid);

      // Đăng nhập một lần
      await client.login("willgotofactory@gmail.com");
      console.log("Logged in successfully.");
    } catch (error) {
      console.error("Error adding proof or setting space:", error.message);
      throw error;
    }
  } else {
    console.error(
      "Missing W3UP_SPACE_DID or W3UP_PROOF in environment variables."
    );
    throw new Error(
      "Missing W3UP_SPACE_DID or W3UP_PROOF in environment variables."
    );
  }

  clientInstance = client; // Lưu client vào biến toàn cục
  return client;
}

async function uploadToIpfs(json, fileName) {
  const client = await makeStorageClient();

  // Tạo file từ JSON
  const file = new File([JSON.stringify(json)], `${fileName}.json`, {
    type: "application/json",
  });

  try {
    // Upload file lên IPFS
    const cid = await client.uploadDirectory([file]);
    console.log("File uploaded successfully. CID:", cid);
    return cid; // Trả về CID của file trên IPFS
  } catch (error) {
    console.error("Error uploading to IPFS:", error.message);
    throw error;
  }
}

module.exports = { uploadToIpfs };
