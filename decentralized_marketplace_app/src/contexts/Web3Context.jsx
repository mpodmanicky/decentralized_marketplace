import React, { createContext, useState, useEffect } from "react";
import { ethers, JsonRpcProvider, BrowserProvider, Contract, Wallet } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";

// Import contract ABIs
import RegistryABI from "../abi/Registry.json";
import RepositoryABI from "../abi/Repository.json";
import MarketplaceABI from "../abi/Marketplace.json";

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkId, setNetworkId] = useState(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [error, setError] = useState(null);
  const [isHardhatWallet, setIsHardhatWallet] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'metamask' or 'hardhat'

  // Contract addresses - replace with your deployed contract addresses
  const REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // example address
  const MARKETPLACE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // example address

  // Function to completely reset state
  const resetState = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setRegistry(null);
    setMarketplace(null);
    setIsDeveloper(false);
    setIsHardhatWallet(false);
    setWalletType(null);
    setError(null);
  };

  // Initialize contracts with given provider and signer
  const initializeContracts = async (provider, signer, userAddress) => {
    try {
      console.log("Initializing contracts with address:", userAddress);

      // Check if contract exists at the address
      const registryCode = await provider.getCode(REGISTRY_ADDRESS);
      if (registryCode === '0x') {
        throw new Error(`No contract found at Registry address: ${REGISTRY_ADDRESS}`);
      }

      console.log("Creating Registry contract instance...");
      // Create contract instances
      const registry = new Contract(
        REGISTRY_ADDRESS,
        RegistryABI.abi,
        signer
      );

      // Check if the contract has the createRepository function
      let hasCreateRepo = false;
      try {
        // First verify if the function exists in the ABI
        hasCreateRepo = registry.interface.hasFunction("createRepository()");
        console.log("Contract has createRepository function:", hasCreateRepo);

        // If it doesn't exist in the ABI, log a warning
        if (!hasCreateRepo) {
          console.error("WARNING: createRepository function not found in the ABI!");
          console.log("Available functions:",
            Object.keys(registry.interface.functions).join(", "));
        }
      } catch (e) {
        console.error("Error checking contract functions:", e);
      }

      // Create the marketplace contract instance
      const marketplaceCode = await provider.getCode(MARKETPLACE_ADDRESS);
      if (marketplaceCode === '0x') {
        throw new Error(`No contract found at Marketplace address: ${MARKETPLACE_ADDRESS}`);
      }

      const marketplace = new Contract(
        MARKETPLACE_ADDRESS,
        MarketplaceABI.abi,
        signer
      );

      // Set contract instances
      setRegistry(registry);
      setMarketplace(marketplace);

      // Check if user is a developer
      try {
        const isDev = await registry.isDeveloper(userAddress);
        console.log("Is developer:", isDev);
        setIsDeveloper(isDev);
      } catch (error) {
        console.error("Error checking developer status:", error);
      }

      return { registry, marketplace };
    } catch (error) {
      console.error("Error initializing contracts:", error);
      setError(`Contract initialization error: ${error.message}`);
      return { registry: null, marketplace: null };
    }
  };

  // MetaMask connection
  const connectWallet = async () => {
    try {
      // First disconnect any existing wallet
      if (account) {
        await disconnectWallet();
      }

      setLoading(true);
      setWalletType('metamask');
      setIsHardhatWallet(false);

      console.log("Connecting to MetaMask...");
      const ethereumProvider = await detectEthereumProvider();

      if (!ethereumProvider) {
        throw new Error("Please install MetaMask!");
      }

      // Force MetaMask to show the account selection modal
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // Now get the selected account
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts available. Please connect an account in MetaMask.");
      }

      const userAccount = accounts[0];
      console.log("Connected to account:", userAccount);
      setAccount(userAccount);

      // Use BrowserProvider for MetaMask
      const web3Provider = new BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();
      setNetworkId(network.chainId);
      setProvider(web3Provider);

      // Get signer
      const userSigner = await web3Provider.getSigner();
      setSigner(userSigner);

      // Initialize contracts
      await initializeContracts(web3Provider, userSigner, userAccount);

      setLoading(false);
    } catch (error) {
      console.error("MetaMask connection error:", error);
      setError(error.message);
      setLoading(false);
      setWalletType(null);
    }
  };

  // Hardhat wallet connection
  const connectHardhatWallet = async () => {
    try {
      // First disconnect any existing wallet
      if (account) {
        await disconnectWallet();
      }

      setLoading(true);
      setWalletType('hardhat');
      setIsHardhatWallet(true);

      console.log("Connecting to Hardhat wallet...");

      // Connect to local Hardhat node with the correct chainId
      const hardhatProvider = new JsonRpcProvider("http://127.0.0.1:8545", {
        chainId: 31337, // <-- Make sure this matches your Hardhat node's chainId
        name: "Hardhat"
      });

      // Use the first Hardhat account
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const wallet = new Wallet(privateKey, hardhatProvider);

      // Set provider and signer
      setProvider(hardhatProvider);
      setSigner(wallet);

      // Get account address
      const hardhatAccount = await wallet.getAddress();
      console.log("Connected to Hardhat account:", hardhatAccount);
      setAccount(hardhatAccount);

      // Get network info and verify chainId
      const network = await hardhatProvider.getNetwork();
      console.log("Connected to network:", network.name, "with chainId:", network.chainId);
      setNetworkId(network.chainId);

      // Initialize contracts
      await initializeContracts(hardhatProvider, wallet, hardhatAccount);

      setLoading(false);
    } catch (error) {
      console.error("Hardhat wallet connection error:", error);
      setError(error.message);
      setLoading(false);
      setWalletType(null);
      setIsHardhatWallet(false);
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = async () => {
    console.log("Disconnecting wallet type:", walletType);

    // Clean up listeners if using MetaMask
    if (walletType === 'metamask' && window.ethereum) {
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");
    }

    // Reset all state
    resetState();
    console.log("Wallet disconnected");
  };

  // Function to get repository contract for a specific address
  const getRepositoryContract = async (address) => {
    if (!signer) return null;
    return new Contract(address, RepositoryABI.abi, signer);
  };

  // Listen for MetaMask events (only when MetaMask is connected)
  useEffect(() => {
    // Only set up listeners for MetaMask
    if (walletType === 'metamask' && window.ethereum) {
      console.log("Setting up MetaMask event listeners");

      const handleAccountsChanged = async (accounts) => {
        console.log("MetaMask accounts changed:", accounts);
        if (accounts.length === 0) {
          // User disconnected their wallet
          await disconnectWallet();
        } else if (accounts[0] !== account) {
          // User switched accounts
          setAccount(accounts[0]);

          // Re-check developer status with new account
          if (registry) {
            try {
              const isDev = await registry.isDeveloper(accounts[0]);
              setIsDeveloper(isDev);
            } catch (error) {
              console.error("Error checking developer status:", error);
            }
          }
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain is changed
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Cleanup function
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }

    // No cleanup needed for non-MetaMask connections
    return () => {};
  }, [walletType, account, registry]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        registry,
        marketplace,
        loading,
        networkId,
        isDeveloper,
        error,
        isHardhatWallet,
        walletType,
        connectWallet,
        disconnectWallet,
        connectHardhatWallet,
        getRepositoryContract, // Make sure this is included
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
