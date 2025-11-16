import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ZenFinancePool
  const ZenFinancePool = await ethers.getContractFactory("ZenFinancePool");
  const pool = await ZenFinancePool.deploy();

  await pool.waitForDeployment();

  console.log("ZenFinancePool deployed to:", await pool.getAddress());

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
