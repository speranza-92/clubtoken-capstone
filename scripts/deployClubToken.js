const hre = require("hardhat");

async function main() {
  const ClubToken = await hre.ethers.getContractFactory("ClubToken");
  const clubToken = await ClubToken.deploy();
  await clubToken.waitForDeployment();
  console.log("ClubToken deployed to:", clubToken.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
