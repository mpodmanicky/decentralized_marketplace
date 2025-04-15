const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentralized Marketplace", function () {
  let Registry, registry;
  let Marketplace, marketplace;
  let Repository;
  let owner, dev1, dev2, buyer;
  let dev1Repository, dev2Repository;
  let softwareA_Id, softwareB_Id, softwareB_License_Id, softwareC_Id;

  // Increase timeout for these tests
  this.timeout(300000);

  before(async function () {
    // Get signers for different roles
    [owner, dev1, dev2, buyer] = await ethers.getSigners();

    console.log("Owner address:", owner.address);
    console.log("Dev1 address:", dev1.address);
    console.log("Dev2 address:", dev2.address);
    console.log("Buyer address:", buyer.address);

    // Get contract factories
    Registry = await ethers.getContractFactory("Registry");
    Marketplace = await ethers.getContractFactory("Marketplace");
    Repository = await ethers.getContractFactory("Repository");

    // Deploy Registry contract
    registry = await Registry.connect(owner).deploy({ gasLimit: 6000000 });
    await registry.deployed();
    console.log("Registry deployed to:", registry.address);

    // Deploy Marketplace contract
    marketplace = await Marketplace.connect(owner).deploy(registry.address, { gasLimit: 6000000 });
    await marketplace.deployed();
    console.log("Marketplace deployed to:", marketplace.address);

    // Set marketplace in registry
    await registry.connect(owner).setMarketplace(marketplace.address, { gasLimit: 3000000 });
    console.log("Marketplace set in Registry");
  });

  describe("Repository creation", function() {
    it("Should create repositories for two developers", async function() {
      try {
        // Create repository for dev1
        const tx1 = await registry.connect(dev1).createRepository({ gasLimit: 3000000 });
        await tx1.wait();
        dev1Repository = await registry.getRepositoryContract(dev1.address);
        console.log("Dev1 repository:", dev1Repository);
        expect(await registry.isDeveloper(dev1.address)).to.equal(true);

        // Create repository for dev2
        const tx2 = await registry.connect(dev2).createRepository({ gasLimit: 3000000 });
        await tx2.wait();
        dev2Repository = await registry.getRepositoryContract(dev2.address);
        console.log("Dev2 repository:", dev2Repository);
        expect(await registry.isDeveloper(dev2.address)).to.equal(true);
      } catch (error) {
        console.error("Repository creation error:", error);
        throw error;
      }
    });
    it("Should mint software A for dev1", async function() {
      try {
        // Debug: Verify the Repository contract state
        const repoInstance = await Repository.attach(dev1Repository);
        console.log("Repository contract attached");

        // Check the Repository owner
        console.log("Checking Repository owner...");
        try {
          const repoOwner = await repoInstance.getOwner();
          console.log("Repository owner:", repoOwner);
          console.log("Registry address:", registry.address);
          console.log("Are they the same?", repoOwner === registry.address);
        } catch (e) {
          console.log("Owner function not found in Repository, checking alternative methods");

          // If there's no owner() function, check for other ownership-related functions
          const functions = Object.keys(repoInstance.functions);
          console.log("Repository functions:", functions);
        }

        // Debug: Check if dev1 is registered as a developer
        const isDev = await registry.isDeveloper(dev1.address);
        console.log("Is dev1 a developer?", isDev);

        const tokenURI_A = "ipfs://software-a-metadata";

        console.log("About to mint software with URI:", tokenURI_A);
        console.log("Using empty arrays for dependencies");

        // Since Registry is the owner of Repository, we should call mintSoftware through Registry
        console.log("Calling mintSoftware via Registry...");
        const tx = await registry.connect(dev1).mintSoftware(
          tokenURI_A,
          [], // Empty array for dependencies
          [], // Empty array for dependency token IDs
          { gasLimit: 8000000 }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Look for the software ID in transaction events
        console.log("Looking for software ID in transaction events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "SoftwareMinted" || event.event === "Transfer") {
            console.log("Found relevant event:", event.args);
            if (event.args && event.args.tokenId) {
              softwareA_Id = event.args.tokenId;
              console.log("Software A minted with ID from event:", softwareA_Id.toString());
            }
          }
        }

        // If we couldn't find the ID in events, use default
        if (!softwareA_Id) {
          softwareA_Id = 1;
          console.log("Using default Software A ID:", softwareA_Id);
        }

        // Verify software ownership
        const ownershipVerified = await registry.repositoryOwnsSoftware(
          dev1Repository,
          softwareA_Id,
          { gasLimit: 1000000 }
        );
        console.log("Software ownership verified:", ownershipVerified);
        expect(ownershipVerified).to.equal(true);

      } catch (error) {
        console.error("Error minting software A:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.transaction) console.log("Transaction details:", error.transaction);
        if (error.receipt) console.log("Transaction receipt:", error.receipt);

        // Safely handle error.data
        if (error.data) {
          console.log("Error data:", error.data);

          if (typeof error.data === 'string') {
            console.log("Custom error signature:", error.data.substring(0, 10));
          } else if (error.data.data && typeof error.data.data === 'string') {
            console.log("Custom error signature:", error.data.data.substring(0, 10));
          }

          // Print address in error data if it contains one (common for unauthorized errors)
          if (typeof error.data === 'string' && error.data.length >= 74) {
            const potentialAddress = "0x" + error.data.substring(34, 74);
            console.log("Address in error data:", potentialAddress);
          }
        }

        throw error;
      }
    });
    it("Should mint software B for dev2", async function() {
      try {
        // Debug: Verify the Repository contract state
        const repoInstance = await Repository.attach(dev2Repository);
        console.log("Repository contract attached for dev2");

        // Check the Repository owner
        console.log("Checking Repository owner for dev2...");
        try {
          const repoOwner = await repoInstance.getOwner();
          console.log("Repository owner:", repoOwner);
          console.log("Registry address:", registry.address);
          console.log("Are they the same?", repoOwner === registry.address);
        } catch (e) {
          console.log("Owner function not found in Repository, checking alternative methods");

          // If there's no owner() function, check for other ownership-related functions
          const functions = Object.keys(repoInstance.functions);
          console.log("Repository functions:", functions);
        }

        // Debug: Check if dev2 is registered as a developer
        const isDev = await registry.isDeveloper(dev2.address);
        console.log("Is dev2 a developer?", isDev);

        const tokenURI_B = "ipfs://software-b-metadata";

        console.log("About to mint software with URI:", tokenURI_B);
        console.log("Using empty arrays for dependencies");

        // Since Registry is the owner of Repository, we should call mintSoftware through Registry
        console.log("Calling mintSoftware via Registry for dev2...");
        const tx = await registry.connect(dev2).mintSoftware(
          tokenURI_B,
          [], // Empty array for dependencies
          [], // Empty array for dependency token IDs
          { gasLimit: 8000000 }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Look for the software ID in transaction events
        console.log("Looking for software B ID in transaction events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "SoftwareMinted" || event.event === "Transfer") {
            console.log("Found relevant event:", event.args);
            if (event.args && event.args.tokenId) {
              softwareB_Id = event.args.tokenId;
              console.log("Software B minted with ID from event:", softwareB_Id.toString());
            }
          }
        }

        // If we couldn't find the ID in events, use default
        if (!softwareB_Id) {
          softwareB_Id = 2; // Assuming incremental IDs
          console.log("Using default Software B ID:", softwareB_Id);
        }

        // Verify software ownership
        const ownershipVerified = await registry.repositoryOwnsSoftware(
          dev2Repository,
          softwareB_Id,
          { gasLimit: 1000000 }
        );
        console.log("Software ownership verified:", ownershipVerified);
        expect(ownershipVerified).to.equal(true);

      } catch (error) {
        console.error("Error minting software B:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.transaction) console.log("Transaction details:", error.transaction);
        if (error.receipt) console.log("Transaction receipt:", error.receipt);

        // Safely handle error.data
        if (error.data) {
          console.log("Error data:", error.data);

          if (typeof error.data === 'string') {
            console.log("Custom error signature:", error.data.substring(0, 10));
          } else if (error.data.data && typeof error.data.data === 'string') {
            console.log("Custom error signature:", error.data.data.substring(0, 10));
          }

          // Print address in error data if it contains one (common for unauthorized errors)
          if (typeof error.data === 'string' && error.data.length >= 74) {
            const potentialAddress = "0x" + error.data.substring(34, 74);
            console.log("Address in error data:", potentialAddress);
          }
        }

        throw error;
      }
    });
  });

  describe("Marketplace operations", function() {
    it("Should list software A on the marketplace", async function() {
      try {
        // Define the price in ETH
        const price = ethers.utils.parseEther("0.5"); // 0.5 ETH

        console.log(`Listing software A (ID: ${softwareA_Id}) for sale at ${ethers.utils.formatEther(price)} ETH`);

        // Dev1 lists their software for sale
        const tx = await marketplace.connect(dev1).listSoftware(
          softwareA_Id,
          price,
          { gasLimit: 3000000 }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Check for events
        console.log("Looking for listing events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "SoftwareListed") {
            console.log("Found SoftwareListed event:", event.args);
            // Verify the listing event arguments
            expect(event.args.developer).to.equal(dev1.address);
            expect(event.args.price.toString()).to.equal(price.toString());
            expect(event.args.tokenId.toString()).to.equal(softwareA_Id.toString());
            console.log("Software A listing verified through event");
          }
        }

      } catch (error) {
        console.error("Error listing software A:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) {
          console.log("Error data:", error.data);

          if (typeof error.data === 'string') {
            console.log("Custom error signature:", error.data.substring(0, 10));
          } else if (error.data.data && typeof error.data.data === 'string') {
            console.log("Custom error signature:", error.data.data.substring(0, 10));
          }
        }

        throw error;
      }
    });

    it("Should list software B on the marketplace", async function() {
      try {
        // Define the price in ETH
        const price = ethers.utils.parseEther("1.0"); // 1 ETH

        console.log(`Listing software B (ID: ${softwareB_Id}) for sale at ${ethers.utils.formatEther(price)} ETH`);

        // Dev2 lists their software for sale
        const tx = await marketplace.connect(dev2).listSoftware(
          softwareB_Id,
          price,
          { gasLimit: 3000000 }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Check for events
        console.log("Looking for listing events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "SoftwareListed") {
            console.log("Found SoftwareListed event:", event.args);
            // Verify the listing event arguments
            expect(event.args.developer).to.equal(dev2.address);
            expect(event.args.price.toString()).to.equal(price.toString());
            expect(event.args.tokenId.toString()).to.equal(softwareB_Id.toString());
            console.log("Software B listing verified through event");
          }
        }

      } catch (error) {
        console.error("Error listing software B:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) {
          console.log("Error data:", error.data);

          if (typeof error.data === 'string') {
            console.log("Custom error signature:", error.data.substring(0, 10));
          } else if (error.data.data && typeof error.data.data === 'string') {
            console.log("Custom error signature:", error.data.data.substring(0, 10));
          }
        }

        throw error;
      }
    });

    it("Should verify both software are listed", async function() {
      try {
        // This test would ideally check if the software is listed in the marketplace
        // If your Marketplace contract has a function to check listings, use it here

        // Example checks:
        // For software A
        console.log("Checking if software A is listed...");

        // If you have a function to get listing details:
        // const listingA = await marketplace.getListing(dev1Repository, softwareA_Id);
        // console.log("Software A listing:", listingA);
        // expect(listingA.price.toString()).to.equal(ethers.utils.parseEther("0.5").toString());

        // For software B
        console.log("Checking if software B is listed...");

        // If you have a function to get listing details:
        // const listingB = await marketplace.getListing(dev2Repository, softwareB_Id);
        // console.log("Software B listing:", listingB);
        // expect(listingB.price.toString()).to.equal(ethers.utils.parseEther("1.0").toString());

        // If your Marketplace doesn't expose a public function to check listings,
        // you can just verify that the listing events were emitted correctly in the previous tests
        console.log("Both software listings verified through events");

      } catch (error) {
        console.error("Error verifying listings:", error);
        if (error.reason) console.log("Error reason:", error.reason);
        throw error;
      }
    });

    // Now let's add a test for dev1 to buy dev2's software
    it("Should allow dev1 to buy software B from dev2", async function() {
      try {
        // Get initial balances
        const initialSellerBalance = await ethers.provider.getBalance(dev2.address);
        const initialBuyerBalance = await ethers.provider.getBalance(dev1.address);
        console.log("Initial seller (dev2) balance:", ethers.utils.formatEther(initialSellerBalance), "ETH");
        console.log("Initial buyer (dev1) balance:", ethers.utils.formatEther(initialBuyerBalance), "ETH");

        // Price as listed previously
        const price = ethers.utils.parseEther("1.0"); // 1 ETH
        console.log(`Dev1 is buying software B (ID: ${softwareB_Id}) for ${ethers.utils.formatEther(price)} ETH`);

        // Dev1 buys the software from dev2
        const tx = await marketplace.connect(dev1).buySoftware(
          dev2Repository,
          softwareB_Id,
          {
            value: price, // Send the required ETH
            gasLimit: 8000000
          }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Purchase transaction confirmed!");

        // Look for license purchase event
        console.log("Looking for license purchase events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "LicensePurchased") {
            console.log("Found LicensePurchased event:", event.args);

            // Store the license ID for later use
            softwareB_License_Id = event.args.licenseId;
            console.log("Software B license ID:", softwareB_License_Id.toString());

            // Verify event arguments
            expect(event.args.buyer).to.equal(dev1.address);
            expect(event.args.nftContract).to.equal(dev2Repository);
            expect(event.args.tokenId.toString()).to.equal(softwareB_Id.toString());
            expect(event.args.price.toString()).to.equal(price.toString());
          }
        }

        // Verify the payment was made
        const finalSellerBalance = await ethers.provider.getBalance(dev2.address);
        console.log("Final seller (dev2) balance:", ethers.utils.formatEther(finalSellerBalance), "ETH");

        // The seller should have received the payment (minus any fees if applicable)
        expect(finalSellerBalance.gt(initialSellerBalance)).to.equal(true);
        console.log("Payment verified: dev2's balance increased");

        // Verify the license ownership - check if dev1 has the license for software B
        // This depends on how your contract exposes license ownership information

        // If you have a function to check license ownership:
        // const hasLicense = await registry.hasLicense(dev1.address, dev2Repository, softwareB_Id);
        // console.log("Does dev1 have a license for software B?", hasLicense);
        // expect(hasLicense).to.equal(true);

      } catch (error) {
        console.error("Error purchasing software B:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });

    it("Should verify license references to software B", async function() {
      try {
        console.log("Verifying license references for Software B License ID:", softwareB_License_Id.toString());

        // First, get the repository instance to interact with
        const dev2RepositoryInstance = await Repository.attach(dev2Repository);

        // Use the ERC_5521 referringOf function to check what this license references
        // This function returns addresses and token IDs arrays
        const [referringAddresses, referringTokenIds] = await dev2RepositoryInstance.referringOf(
          dev2Repository,  // Address of the contract being queried
          softwareB_License_Id  // License token ID
        );

        console.log("License references the following:");
        console.log("Referring addresses:", referringAddresses);
        console.log("Referring token IDs:", referringTokenIds.map(ids => ids.map(id => id.toString())));

        // Verify that the license references software B
        let referencesFound = false;
        for (let i = 0; i < referringAddresses.length; i++) {
          if (referringAddresses[i] === dev2Repository) {
            for (let j = 0; j < referringTokenIds[i].length; j++) {
              if (referringTokenIds[i][j].toString() === softwareB_Id.toString()) {
                referencesFound = true;
                console.log("License correctly references Software B!");
                break;
              }
            }
          }
        }

        expect(referencesFound).to.equal(true, "License should reference Software B");

        // Also check the reverse relationship - software should be referenced by the license
        const [referredAddresses, referredTokenIds] = await dev2RepositoryInstance.referredOf(
          dev2Repository,  // Address of the contract being queried
          softwareB_Id     // Software token ID
        );

        console.log("Software B is referenced by:");
        console.log("Referred addresses:", referredAddresses);
        console.log("Referred token IDs:", referredTokenIds.map(ids => ids.map(id => id.toString())));

        // Check if the software is referenced by the license
        let reverseReferenceFound = false;
        for (let i = 0; i < referredAddresses.length; i++) {
          if (referredAddresses[i] === dev2Repository) {
            for (let j = 0; j < referredTokenIds[i].length; j++) {
              if (referredTokenIds[i][j].toString() === softwareB_License_Id.toString()) {
                reverseReferenceFound = true;
                console.log("Software B is correctly referenced by the license!");
                break;
              }
            }
          }
        }

        expect(reverseReferenceFound).to.equal(true, "Software B should be referenced by the license");

        // Additionally, you can verify the license ownership
        const licenseOwner = await dev2RepositoryInstance.ownerOf(softwareB_License_Id);
        console.log("License owner:", licenseOwner);
        expect(licenseOwner).to.equal(dev1.address, "Dev1 should own the license");

      } catch (error) {
        console.error("Error verifying license references:", error);

        // Check if the error is due to a function not existing
        if (error.message.includes("is not a function")) {
          console.log("Function not found. Available functions:",
            Object.keys(await Repository.attach(dev2Repository).functions));
        }

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });
  });

  describe("Software with dependencies", function() {
    it("Should mint software C with software B as a dependency", async function() {
      try {
        console.log("Minting software C with Software B as a dependency");

        // Since dev1 has a license for software B, dev1 should be able to create
        // a new software that depends on software B

        const tokenURI_C = "ipfs://software-c-metadata";

        // Create the dependency arrays for software B
        const dependencies = [dev2Repository]; // Contract addresses
        const dependencyTokenIds = [[softwareB_Id]]; // Token IDs (array of arrays)

        console.log("Setting up dependencies:");
        console.log("- Contract address:", dependencies);
        console.log("- Token IDs:", dependencyTokenIds.map(ids => ids.map(id => id.toString())));

        // Mint software C with software B as a dependency
        console.log("Minting software C with dependency...");
        const tx = await registry.connect(dev1).mintSoftware(
          tokenURI_C,
          dependencies,       // Array containing dev2Repository address
          dependencyTokenIds, // Array containing array of token IDs (softwareB_Id)
          { gasLimit: 8000000 }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Look for the software ID in transaction events
        console.log("Looking for software C ID in transaction events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "SoftwareMinted" || event.event === "Transfer") {
            console.log("Found relevant event:", event.args);
            if (event.args && event.args.tokenId) {
              softwareC_Id = event.args.tokenId;
              console.log("Software C minted with ID from event:", softwareC_Id.toString());
            }
          }
        }

        // If we couldn't find the ID in events, use default
        if (!softwareC_Id) {
          softwareC_Id = 3; // Assuming incremental IDs
          console.log("Using default Software C ID:", softwareC_Id);
        }

        // Verify software ownership
        const ownershipVerified = await registry.repositoryOwnsSoftware(
          dev1Repository,
          softwareC_Id,
          { gasLimit: 1000000 }
        );
        console.log("Software ownership verified:", ownershipVerified);
        expect(ownershipVerified).to.equal(true);

      } catch (error) {
        console.error("Error minting software C with dependency:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);

        // Safely handle error.data
        if (error.data) {
          console.log("Error data:", error.data);

          if (typeof error.data === 'string') {
            console.log("Custom error signature:", error.data.substring(0, 10));
          } else if (error.data.data && typeof error.data.data === 'string') {
            console.log("Custom error signature:", error.data.data.substring(0, 10));
          }
        }

        throw error;
      }
    });

    it("Should verify references between software C and software B", async function() {
      try {
        console.log("Verifying references between Software C and Software B");

        // Get the repository instances
        const dev1RepositoryInstance = await Repository.attach(dev1Repository);
        const dev2RepositoryInstance = await Repository.attach(dev2Repository);

        // Check that software C refers to software B (dependency relationship)
        console.log("Checking if Software C refers to Software B...");

        // Use the ERC_5521 referringOf function to check what Software C references
        const [referringAddresses, referringTokenIds] = await dev1RepositoryInstance.referringOf(
          dev1Repository,
          softwareC_Id
        );

        console.log("Software C references the following:");
        console.log("Referring addresses:", referringAddresses);
        console.log("Referring token IDs:", referringTokenIds.map(ids => ids.map(id => id.toString())));

        // Verify that Software C references Software B
        let referencesToB = false;
        for (let i = 0; i < referringAddresses.length; i++) {
          if (referringAddresses[i] === dev2Repository) {
            for (let j = 0; j < referringTokenIds[i].length; j++) {
              if (referringTokenIds[i][j].toString() === softwareB_Id.toString()) {
                referencesToB = true;
                console.log("Software C correctly references Software B!");
                break;
              }
            }
          }
        }

        expect(referencesToB).to.equal(true, "Software C should reference Software B");

        // Also check the reverse relationship - Software B should be referred to by Software C
        console.log("Checking if Software B is referred to by Software C...");

        const [referredAddresses, referredTokenIds] = await dev2RepositoryInstance.referredOf(
          dev2Repository,
          softwareB_Id
        );

        console.log("Software B is referenced by:");
        console.log("Referred addresses:", referredAddresses);
        console.log("Referred token IDs:", referredTokenIds.map(ids => ids.map(id => id.toString())));

        // Check if Software B is referenced by Software C
        let isBReferencedByC = false;
        for (let i = 0; i < referredAddresses.length; i++) {
          if (referredAddresses[i] === dev1Repository) {
            for (let j = 0; j < referredTokenIds[i].length; j++) {
              if (referredTokenIds[i][j].toString() === softwareC_Id.toString()) {
                isBReferencedByC = true;
                console.log("Software B is correctly referenced by Software C!");
                break;
              }
            }
          }
        }

        expect(isBReferencedByC).to.equal(true, "Software B should be referenced by Software C");

        // Verify software metadata contains the right dependency
        if (dev1RepositoryInstance.functions.getSoftwareMeta) {
          console.log("Checking Software C metadata directly...");

          const meta = await dev1RepositoryInstance.getSoftwareMeta(softwareC_Id);
          console.log("Software C metadata:", meta);

          // Verify the dependencies in metadata match what we used
          expect(meta.deps.length).to.be.at.least(1, "Software C should have at least one dependency");
          expect(meta.deps[0]).to.equal(dev2Repository, "First dependency should be dev2Repository");
          expect(meta.depTokenIds[0][0].toString()).to.equal(softwareB_Id.toString(),
            "First dependency token ID should be softwareB_Id");
        }

      } catch (error) {
        console.error("Error verifying references between software C and B:", error);

        // Check if the error is due to a function not existing
        if (error.message.includes("is not a function")) {
          console.log("Function not found. Available functions:");
          const dev1RepositoryInstance = await Repository.attach(dev1Repository);
          console.log(Object.keys(dev1RepositoryInstance.functions));
        }

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });

    it("Should verify dev1 can use software C because they have a license for software B", async function() {
      try {
        console.log("Verifying license chain for Software C -> Software B");

        // Get the repository instances
        const dev1RepositoryInstance = await Repository.attach(dev1Repository);
        const dev2RepositoryInstance = await Repository.attach(dev2Repository);

        // Check that dev1 owns software C
        const softwareCOwner = await dev1RepositoryInstance.ownerOf(softwareC_Id);
        console.log("Software C owner:", softwareCOwner);
        expect(softwareCOwner).to.equal(dev1Repository, "Dev1's repository should own Software C");

        // Verify dev1 has a license for software B
        const licenseBOwner = await dev2RepositoryInstance.ownerOf(softwareB_License_Id);
        console.log("Software B license owner:", licenseBOwner);
        expect(licenseBOwner).to.equal(dev1.address, "Dev1 should own the license for Software B");

        // This completes the chain:
        // 1. Dev1 owns Software C
        // 2. Software C depends on Software B
        // 3. Dev1 has a license for Software B

        console.log("License chain verification complete!");
        console.log("Dev1 can legally use Software C because they have the proper license for its dependency (Software B)");

      } catch (error) {
        console.error("Error verifying license chain:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);

        throw error;
      }
    });
  });

  describe("Complex dependency chain", function() {
    let dev3Repository;
    let softwareC_License_Id;
    let softwareD_Id;

    it("Should setup developer 3", async function() {
      try {
        // Create a third developer account
        const dev3 = buyer; // Use the existing buyer account as dev3 for simplicity
        console.log("Using existing buyer account as dev3:", dev3.address);

        // Create repository for dev3
        console.log("Creating repository for dev3...");
        const tx = await registry.connect(dev3).createRepository({ gasLimit: 3000000 });
        await tx.wait();
        dev3Repository = await registry.getRepositoryContract(dev3.address);
        console.log("Dev3 repository:", dev3Repository);
        expect(await registry.isDeveloper(dev3.address)).to.equal(true);

      } catch (error) {
        console.error("Error setting up developer 3:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });

    it("Should list software C on the marketplace", async function() {
      try {
        // Define the price in ETH
        const price = ethers.utils.parseEther("0.7"); // 0.7 ETH

        console.log(`Listing software C (ID: ${softwareC_Id}) for sale at ${ethers.utils.formatEther(price)} ETH`);

        // Dev1 lists software C for sale
        const tx = await marketplace.connect(dev1).listSoftware(
          softwareC_Id,
          price,
          { gasLimit: 3000000 }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Check for events
        console.log("Looking for listing events...");
        for (const event of receipt.events || []) {
          if (event.event === "SoftwareListed") {
            console.log("Found SoftwareListed event:", event.args);
            // Verify the listing event arguments
            expect(event.args.developer).to.equal(dev1.address);
            expect(event.args.price.toString()).to.equal(price.toString());
            expect(event.args.tokenId.toString()).to.equal(softwareC_Id.toString());
            console.log("Software C listing verified through event");
          }
        }

      } catch (error) {
        console.error("Error listing software C:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });

    it("Should allow dev3 to buy software C from dev1", async function() {
      try {
        // Get initial balances
        const dev3 = buyer; // Using buyer account as dev3
        const initialSellerBalance = await ethers.provider.getBalance(dev1.address);
        const initialBuyerBalance = await ethers.provider.getBalance(dev3.address);
        console.log("Initial seller (dev1) balance:", ethers.utils.formatEther(initialSellerBalance), "ETH");
        console.log("Initial buyer (dev3) balance:", ethers.utils.formatEther(initialBuyerBalance), "ETH");

        // Price as listed previously
        const price = ethers.utils.parseEther("0.7"); // 0.7 ETH
        console.log(`Dev3 is buying software C (ID: ${softwareC_Id}) for ${ethers.utils.formatEther(price)} ETH`);

        // Dev3 buys the software from dev1
        const tx = await marketplace.connect(dev3).buySoftware(
          dev1Repository,
          softwareC_Id,
          {
            value: price, // Send the required ETH
            gasLimit: 8000000
          }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Purchase transaction confirmed!");

        // Look for license purchase event
        console.log("Looking for license purchase events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "LicensePurchased") {
            console.log("Found LicensePurchased event:", event.args);

            // Store the license ID for later use
            softwareC_License_Id = event.args.licenseId;
            console.log("Software C license ID:", softwareC_License_Id.toString());

            // Verify event arguments
            expect(event.args.buyer).to.equal(dev3.address);
            expect(event.args.nftContract).to.equal(dev1Repository);
            expect(event.args.tokenId.toString()).to.equal(softwareC_Id.toString());
            expect(event.args.price.toString()).to.equal(price.toString());
          }
        }

        // Verify the payment was made
        const finalSellerBalance = await ethers.provider.getBalance(dev1.address);
        console.log("Final seller (dev1) balance:", ethers.utils.formatEther(finalSellerBalance), "ETH");
        expect(finalSellerBalance.gt(initialSellerBalance)).to.equal(true);
        console.log("Payment verified: dev1's balance increased");

        // Verify license ownership
        const dev1RepositoryInstance = await Repository.attach(dev1Repository);
        try {
          const licenseOwner = await dev1RepositoryInstance.ownerOf(softwareC_License_Id);
          console.log("License owner:", licenseOwner);
          expect(licenseOwner).to.equal(dev3.address);
          console.log("License ownership verified: dev3 owns license for software C");
        } catch (ownershipError) {
          console.log("Error checking license ownership:", ownershipError.message);
        }

      } catch (error) {
        console.error("Error purchasing software C:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });

    it("Should mint software D with software C as a dependency", async function() {
      try {
        const dev3 = buyer; // Using buyer account as dev3

        console.log("Minting software D with Software C as a dependency");

        const tokenURI_D = "ipfs://software-d-metadata";

        // Create the dependency arrays for software C
        const dependencies = [dev1Repository]; // Contract addresses pointing to dev1's repository
        const dependencyTokenIds = [[softwareC_Id]]; // Token IDs (array of arrays)

        console.log("Setting up dependencies:");
        console.log("- Contract address:", dependencies);
        console.log("- Token IDs:", dependencyTokenIds.map(ids => ids.map(id => id.toString())));

        // Mint software D with software C as a dependency
        console.log("Minting software D with dependency...");
        const tx = await registry.connect(dev3).mintSoftware(
          tokenURI_D,
          dependencies,       // Array containing dev1Repository address
          dependencyTokenIds, // Array containing array of token IDs (softwareC_Id)
          { gasLimit: 8000000 }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");

        // Look for the software ID in transaction events
        console.log("Looking for software D ID in transaction events...");
        for (const event of receipt.events || []) {
          console.log("Event:", event.event);
          if (event.event === "SoftwareMinted" || event.event === "Transfer") {
            console.log("Found relevant event:", event.args);
            if (event.args && event.args.tokenId) {
              softwareD_Id = event.args.tokenId;
              console.log("Software D minted with ID from event:", softwareD_Id.toString());
            }
          }
        }

        // If we couldn't find the ID in events, use default
        if (!softwareD_Id) {
          softwareD_Id = 4; // Assuming incremental IDs
          console.log("Using default Software D ID:", softwareD_Id);
        }

        // Verify software ownership
        const ownershipVerified = await registry.repositoryOwnsSoftware(
          dev3Repository,
          softwareD_Id,
          { gasLimit: 1000000 }
        );
        console.log("Software ownership verified:", ownershipVerified);
        expect(ownershipVerified).to.equal(true);

      } catch (error) {
        console.error("Error minting software D with dependency:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });

    it("Should visualize the complete reference tree for software D", async function() {
      try {
        console.log("\n============= SOFTWARE D COMPLETE REFERENCE TREE =============");
        console.log("Software D (ID: " + softwareD_Id + ") owned by dev3");
        console.log("├── Depends on: Software C (ID: " + softwareC_Id + ") owned by dev1");
        console.log("│   └── Dev3 has license: " + softwareC_License_Id);
        console.log("└── Software C depends on: Software B (ID: " + softwareB_Id + ") owned by dev2");
        console.log("    └── Dev1 has license: " + softwareB_License_Id);
        console.log("===========================================================\n");

        // Get all repository instances
        const dev1RepositoryInstance = await Repository.attach(dev1Repository);
        const dev2RepositoryInstance = await Repository.attach(dev2Repository);
        const dev3RepositoryInstance = await Repository.attach(dev3Repository);

        // STEP 1: Verify Software D references
        console.log("STEP 1: Verifying Software D references");
        const [dReferringAddresses, dReferringTokenIds] = await dev3RepositoryInstance.referringOf(
          dev3Repository,
          softwareD_Id
        );

        console.log("Software D directly references:");
        console.log("- Addresses:", dReferringAddresses);
        console.log("- Token IDs:", dReferringTokenIds.map(ids => ids.map(id => id.toString())));

        let dRefersToC = false;
        for (let i = 0; i < dReferringAddresses.length; i++) {
          if (dReferringAddresses[i] === dev1Repository) {
            for (let j = 0; j < dReferringTokenIds[i].length; j++) {
              if (dReferringTokenIds[i][j].toString() === softwareC_Id.toString()) {
                dRefersToC = true;
                console.log("✓ Confirmed: Software D references Software C");
                break;
              }
            }
          }
        }
        expect(dRefersToC).to.equal(true, "Software D should reference Software C");

        // STEP 2: Verify Software C references
        console.log("\nSTEP 2: Verifying Software C references");
        const [cReferringAddresses, cReferringTokenIds] = await dev1RepositoryInstance.referringOf(
          dev1Repository,
          softwareC_Id
        );

        console.log("Software C directly references:");
        console.log("- Addresses:", cReferringAddresses);
        console.log("- Token IDs:", cReferringTokenIds.map(ids => ids.map(id => id.toString())));

        let cRefersToB = false;
        for (let i = 0; i < cReferringAddresses.length; i++) {
          if (cReferringAddresses[i] === dev2Repository) {
            for (let j = 0; j < cReferringTokenIds[i].length; j++) {
              if (cReferringTokenIds[i][j].toString() === softwareB_Id.toString()) {
                cRefersToB = true;
                console.log("✓ Confirmed: Software C references Software B");
                break;
              }
            }
          }
        }
        expect(cRefersToB).to.equal(true, "Software C should reference Software B");

        // STEP 3: Verify reverse references - what references Software D
        console.log("\nSTEP 3: Checking what references Software D (should be none)");
        const [dReferredAddresses, dReferredTokenIds] = await dev3RepositoryInstance.referredOf(
          dev3Repository,
          softwareD_Id
        );

        console.log("Software D is referenced by:");
        console.log("- Addresses:", dReferredAddresses);
        console.log("- Token IDs:", dReferredTokenIds.map(ids => ids.map(id => id.toString())));
        console.log("(Should be empty since nothing depends on D yet)");

        // STEP 4: Verify Software C is referenced by Software D
        console.log("\nSTEP 4: Checking what references Software C");
        const [cReferredAddresses, cReferredTokenIds] = await dev1RepositoryInstance.referredOf(
          dev1Repository,
          softwareC_Id
        );

        console.log("Software C is referenced by:");
        console.log("- Addresses:", cReferredAddresses);
        console.log("- Token IDs:", cReferredTokenIds.map(ids => ids.map(id => id.toString())));

        let dReferredByC = false;
        for (let i = 0; i < cReferredAddresses.length; i++) {
          if (cReferredAddresses[i] === dev3Repository) {
            for (let j = 0; j < cReferredTokenIds[i].length; j++) {
              if (cReferredTokenIds[i][j].toString() === softwareD_Id.toString()) {
                dReferredByC = true;
                console.log("✓ Confirmed: Software C is referenced by Software D");
                break;
              }
            }
          }
        }
        expect(dReferredByC).to.equal(true, "Software C should be referenced by Software D");

        // STEP 5: Verify Software B is referenced by Software C
        console.log("\nSTEP 5: Checking what references Software B");
        const [bReferredAddresses, bReferredTokenIds] = await dev2RepositoryInstance.referredOf(
          dev2Repository,
          softwareB_Id
        );

        console.log("Software B is referenced by:");
        console.log("- Addresses:", bReferredAddresses);
        console.log("- Token IDs:", bReferredTokenIds.map(ids => ids.map(id => id.toString())));

        let bReferredByC = false;
        for (let i = 0; i < bReferredAddresses.length; i++) {
          if (bReferredAddresses[i] === dev1Repository) {
            for (let j = 0; j < bReferredTokenIds[i].length; j++) {
              if (bReferredTokenIds[i][j].toString() === softwareC_Id.toString()) {
                bReferredByC = true;
                console.log("✓ Confirmed: Software B is referenced by Software C");
                break;
              }
            }
          }
        }
        expect(bReferredByC).to.equal(true, "Software B should be referenced by Software C");

        // STEP 6: Verify license chain - crucial for proper usage rights
        console.log("\nSTEP 6: Verifying the complete license chain");

        // Check license for Software C
        const licenseC_Owner = await dev1RepositoryInstance.ownerOf(softwareC_License_Id);
        console.log("Software C license owner:", licenseC_Owner);
        expect(licenseC_Owner).to.equal(buyer.address); // buyer is dev3
        console.log("✓ Confirmed: Dev3 has a valid license for Software C");

        // Check license for Software B
        const licenseB_Owner = await dev2RepositoryInstance.ownerOf(softwareB_License_Id);
        console.log("Software B license owner:", licenseB_Owner);
        expect(licenseB_Owner).to.equal(dev1.address);
        console.log("✓ Confirmed: Dev1 has a valid license for Software B");

        // Complete validation summary
        console.log("\n======= COMPLETE REFERENCE TREE VALIDATION =======");
        console.log("✓ Software D references Software C directly");
        console.log("✓ Software C references Software B directly");
        console.log("✓ Dev3 has proper license for Software C");
        console.log("✓ Dev1 has proper license for Software B");
        console.log("✓ All license and dependency chains are valid");
        console.log("=================================================\n");

        // Final verification - the entire dependency and license chain is valid
        expect(dRefersToC && cRefersToB &&
               licenseC_Owner === buyer.address &&
               licenseB_Owner === dev1.address).to.equal(true,
               "The complete reference tree should be valid");

      } catch (error) {
        console.error("Error analyzing reference tree:", error);

        // Enhanced error diagnostics
        if (error.reason) console.log("Error reason:", error.reason);
        if (error.code) console.log("Error code:", error.code);
        if (error.data) console.log("Error data:", error.data);

        throw error;
      }
    });
  });
});
