import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Compiling contracts...");
  
  // Get the contract factory
  const Collection = await ethers.getContractFactory("Collection");
  
  // Get the ABI and bytecode
  const abi = Collection.interface.fragments.map(f => f.format("json")).map(f => JSON.parse(f));
  const bytecode = Collection.bytecode;
  
  // Create the JSON artifact
  const artifact = {
    _format: "hh-sol-artifact-1",
    contractName: "Collection",
    sourceName: "contracts/Collection.sol",
    abi: abi,
    bytecode: bytecode,
    deployedBytecode: bytecode,
    linkReferences: {},
    deployedLinkReferences: {}
  };
  
  // Write to contracts/Collection.json
  const contractsDir = path.join(__dirname, "..", "contracts");
  const artifactPath = path.join(contractsDir, "Collection.json");
  
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  
  console.log("Contract compiled successfully!");
  console.log("ABI saved to:", artifactPath);
  console.log("Functions available:");
  
  // List all functions
  abi.forEach((item: any) => {
    if (item.type === 'function') {
      console.log(`- ${item.name}(${item.inputs.map((i: any) => `${i.type} ${i.name}`).join(', ')})`);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});