import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const name = process.env.COLLECTION_NAME || "NFT Collection";
  const symbol = process.env.COLLECTION_SYMBOL || "NFTC";
  const baseURI = process.env.BASE_URI || "";

  const Collection = await ethers.getContractFactory("Collection");
  const collection = await Collection.deploy(name, symbol, baseURI);

  await collection.deployed();

  console.log("Collection deployed to:", collection.address);
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Base URI:", baseURI);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });