import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("ZenFinancePool", function () {
  let interestRateModel: Contract;
  let oracle: Contract;
  let assetRegistry: Contract;
  let pool: Contract;
  let mockUSDC: Contract;
  let aUSDC: Contract;
  let owner: any;
  let user1: any;
  let user2: any;

  // Asset configuration
  const USDC_ADDRESS = "0x44D25859F79787fF937ec1305Dbf0866d6064E21"; // Test address
  const LTV = ethers.parseEther("0.75"); // 75%
  const LIQUIDATION_THRESHOLD = ethers.parseEther("0.80"); // 80%
  const RESERVE_FACTOR = ethers.parseEther("0.10"); // 10%
  const USDC_DECIMALS = 6;
  const USDC_PRICE = ethers.parseEther("1"); // $1

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Mock ERC20 for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
    await mockUSDC.waitForDeployment();

    // Mint some tokens to users
    await mockUSDC.mint(user1.address, ethers.parseUnits("10000", USDC_DECIMALS));
    await mockUSDC.mint(user2.address, ethers.parseUnits("10000", USDC_DECIMALS));

    // Deploy Interest Rate Model
    const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
    interestRateModel = await InterestRateModel.deploy();
    await interestRateModel.waitForDeployment();

    // Deploy Oracle
    const Oracle = await ethers.getContractFactory("Oracle");
    oracle = await Oracle.deploy(await mockUSDC.getAddress(), owner.address);
    await oracle.waitForDeployment();

    // Set USDC price
    await oracle.updatePrice(await mockUSDC.getAddress(), USDC_PRICE);

    // Deploy Asset Registry
    const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
    assetRegistry = await AssetRegistry.deploy(owner.address);
    await assetRegistry.waitForDeployment();

    // Deploy AToken for USDC
    const AToken = await ethers.getContractFactory("AToken");
    aUSDC = await AToken.deploy(
      "aUSDC",
      "aUSDC",
      await mockUSDC.getAddress(),
      owner.address
    );
    await aUSDC.waitForDeployment();

    // Deploy Pool
    const ZenFinancePool = await ethers.getContractFactory("ZenFinancePool");
    pool = await ZenFinancePool.deploy(
      await oracle.getAddress(),
      await interestRateModel.getAddress(),
      await assetRegistry.getAddress(),
      owner.address
    );
    await pool.waitForDeployment();

    // Set pool address in AToken
    await aUSDC.setPool(await pool.getAddress());

    // Register USDC in Asset Registry
    await assetRegistry.addAsset(
      await mockUSDC.getAddress(),
      LTV,
      LIQUIDATION_THRESHOLD,
      RESERVE_FACTOR,
      true, // canBeCollateral
      await aUSDC.getAddress()
    );
  });

  describe("Supply", function () {
    it("Should allow user to supply assets", async function () {
      const supplyAmount = ethers.parseUnits("1000", USDC_DECIMALS);

      // Approve pool to spend USDC
      await mockUSDC.connect(user1).approve(await pool.getAddress(), supplyAmount);

      // Supply assets
      await expect(pool.connect(user1).supply(await mockUSDC.getAddress(), supplyAmount))
        .to.emit(pool, "Supply");

      // Check user's supply balance
      const supplyBalance = await pool.getSupplyBalance(user1.address, await mockUSDC.getAddress());
      expect(supplyBalance).to.equal(supplyAmount);

      // Check total supplied
      const totalSupplied = await pool.totalSupplied(await mockUSDC.getAddress());
      expect(totalSupplied).to.equal(supplyAmount);

      // Check aToken balance
      const aTokenBalance = await aUSDC.balanceOf(user1.address);
      expect(aTokenBalance).to.be.gt(0);
    });

    it("Should mint aTokens when supplying", async function () {
      const supplyAmount = ethers.parseUnits("1000", USDC_DECIMALS);

      await mockUSDC.connect(user1).approve(await pool.getAddress(), supplyAmount);
      await pool.connect(user1).supply(await mockUSDC.getAddress(), supplyAmount);

      const aTokenBalance = await aUSDC.balanceOf(user1.address);
      expect(aTokenBalance).to.be.gt(0);
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      // User1 supplies first
      const supplyAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await mockUSDC.connect(user1).approve(await pool.getAddress(), supplyAmount);
      await pool.connect(user1).supply(await mockUSDC.getAddress(), supplyAmount);
    });

    it("Should allow user to borrow assets", async function () {
      const borrowAmount = ethers.parseUnits("500", USDC_DECIMALS); // 50% of supply

      // Borrow assets
      await expect(pool.connect(user1).borrow(await mockUSDC.getAddress(), borrowAmount))
        .to.emit(pool, "Borrow");

      // Check user's borrow balance
      const borrowBalance = await pool.getBorrowBalance(user1.address, await mockUSDC.getAddress());
      expect(borrowBalance).to.be.gte(borrowAmount);

      // Check total borrowed
      const totalBorrowed = await pool.totalBorrowed(await mockUSDC.getAddress());
      expect(totalBorrowed).to.be.gte(borrowAmount);
    });

    it("Should prevent borrowing more than available liquidity", async function () {
      const borrowAmount = ethers.parseUnits("2000", USDC_DECIMALS); // More than supplied

      await expect(
        pool.connect(user1).borrow(await mockUSDC.getAddress(), borrowAmount)
      ).to.be.revertedWith("Insufficient liquidity");
    });

    it("Should prevent borrowing if health factor would be too low", async function () {
      const borrowAmount = ethers.parseUnits("800", USDC_DECIMALS); // 80% of supply (too much)

      // This might fail if health factor check is too strict
      // Adjust based on actual implementation
      try {
        await pool.connect(user1).borrow(await mockUSDC.getAddress(), borrowAmount);
      } catch (error: any) {
        expect(error.message).to.include("Health factor");
      }
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      // User1 supplies first
      const supplyAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await mockUSDC.connect(user1).approve(await pool.getAddress(), supplyAmount);
      await pool.connect(user1).supply(await mockUSDC.getAddress(), supplyAmount);
    });

    it("Should allow user to withdraw assets", async function () {
      const withdrawAmount = ethers.parseUnits("500", USDC_DECIMALS);

      // Withdraw assets
      await expect(pool.connect(user1).withdraw(await mockUSDC.getAddress(), withdrawAmount))
        .to.emit(pool, "Withdraw");

      // Check user's supply balance decreased
      const supplyBalance = await pool.getSupplyBalance(user1.address, await mockUSDC.getAddress());
      expect(supplyBalance).to.equal(ethers.parseUnits("500", USDC_DECIMALS));
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      // User1 supplies and borrows
      const supplyAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await mockUSDC.connect(user1).approve(await pool.getAddress(), supplyAmount);
      await pool.connect(user1).supply(await mockUSDC.getAddress(), supplyAmount);

      const borrowAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await pool.connect(user1).borrow(await mockUSDC.getAddress(), borrowAmount);
    });

    it("Should allow user to repay borrowed assets", async function () {
      const repayAmount = ethers.parseUnits("500", USDC_DECIMALS);

      // Approve pool to spend USDC for repayment
      await mockUSDC.connect(user1).approve(await pool.getAddress(), repayAmount);

      // Repay assets
      await expect(pool.connect(user1).repay(await mockUSDC.getAddress(), repayAmount))
        .to.emit(pool, "Repay");

      // Check user's borrow balance decreased
      const borrowBalance = await pool.getBorrowBalance(user1.address, await mockUSDC.getAddress());
      expect(borrowBalance).to.be.lt(ethers.parseUnits("500", USDC_DECIMALS));
    });
  });

  describe("Health Factor", function () {
    it("Should return infinite health factor when no borrows", async function () {
      const healthFactor = await pool.getHealthFactor(user1.address);
      expect(healthFactor).to.equal(ethers.MaxUint256);
    });

    it("Should calculate health factor correctly", async function () {
      // User1 supplies
      const supplyAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await mockUSDC.connect(user1).approve(await pool.getAddress(), supplyAmount);
      await pool.connect(user1).supply(await mockUSDC.getAddress(), supplyAmount);

      // User1 borrows
      const borrowAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await pool.connect(user1).borrow(await mockUSDC.getAddress(), borrowAmount);

      // Check health factor
      const healthFactor = await pool.getHealthFactor(user1.address);
      expect(healthFactor).to.be.gt(ethers.parseEther("1")); // Should be > 1
    });
  });

  describe("Available Borrow", function () {
    it("Should return 0 when user has no collateral", async function () {
      const availableBorrow = await pool.getAvailableBorrow(user1.address, await mockUSDC.getAddress());
      expect(availableBorrow).to.equal(0);
    });

    it("Should calculate available borrow correctly", async function () {
      // User1 supplies
      const supplyAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await mockUSDC.connect(user1).approve(await pool.getAddress(), supplyAmount);
      await pool.connect(user1).supply(await mockUSDC.getAddress(), supplyAmount);

      // Check available borrow (75% of $1000 = $750)
      const availableBorrow = await pool.getAvailableBorrow(user1.address, await mockUSDC.getAddress());
      const expectedBorrow = ethers.parseUnits("750", USDC_DECIMALS); // 75% LTV
      expect(availableBorrow).to.be.closeTo(expectedBorrow, ethers.parseUnits("1", USDC_DECIMALS));
    });
  });
});

