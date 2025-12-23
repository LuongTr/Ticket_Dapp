const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying LuminaTicket contract...");

  // Get the contract factory
  const LuminaTicket = await ethers.getContractFactory("LuminaTicket");

  // Deploy the contract
  const luminaTicket = await LuminaTicket.deploy();

  // Wait for deployment to complete
  await luminaTicket.waitForDeployment();

  const contractAddress = await luminaTicket.getAddress();

  console.log("LuminaTicket deployed to:", contractAddress);

  // Verify contract on Etherscan (for Sepolia)
  if (network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await luminaTicket.deploymentTransaction().wait(6); // Wait for 6 confirmations

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Verification failed:", error.message);
    }
  }

  // Log deployment info
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${await ethers.getSigners()[0].getAddress()}`);

  // Save deployment info to a file
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress,
    network: network.name,
    deployer: await ethers.getSigners()[0].getAddress(),
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment.json");
}

// Handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
