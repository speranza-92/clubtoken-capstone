const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const NFT = await hre.ethers.getContractFactory("MembershipNFT");
    const nft = await NFT.deploy(deployer.address);

    await nft.waitForDeployment();
    console.log("NFT deployed to:", await nft.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
