// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

import "./Registry.sol";

contract Marketplace {
    Registry private registry;

    struct Listing {
        address developer;
        uint256 price;
    }
    mapping(address => mapping(uint256 => Listing)) private listings; // developer -> tokenId -> listing
    modifier isSeller(
        address nftContract,
        uint256 tokenId,
        address spender
    ) {
        require(
            listings[address(nftContract)][tokenId].developer == spender,
            "Not the seller"
        );
        _;
    }
    modifier isListed(address nftContract, uint256 tokenId) {
        require(listings[nftContract][tokenId].price > 0, "Not listed");
        _;
    }
    modifier notListed(address nftContract, uint256 tokenId) {
        require(listings[nftContract][tokenId].price == 0, "Already listed");
        _;
    }

    constructor(address _registry) {
        registry = Registry(_registry);
    }

    event Debug(string message);
    // Event to track software listings
    event SoftwareListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed developer,
        uint256 price
    );
    // Event to track software license purchases
    event LicensePurchased(
        address indexed buyer,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 licenseId,
        uint256 price
    );

    /// @notice List a software NFT on the marketplace
    /// @param tokenId The token ID of the software NFT
    /// @param price The price of the software NFT
    function listSoftware(
        uint256 tokenId,
        uint256 price
    ) external notListed(registry.getRepositoryContract(msg.sender), tokenId) {
        // Check if the sender is a registered developer
        require(
            registry.isDeveloper(msg.sender),
            "Only developers can list software"
        );

        // Get the developer's repository contract
        address repositoryAddress = registry.getRepositoryContract(msg.sender);
        require(repositoryAddress != address(0), "Developer has no repository");

        // Check if the repository owns the NFT through the Registry
        require(
            registry.repositoryOwnsSoftware(repositoryAddress, tokenId),
            "Repository does not own this token"
        );

        // Create the listing
        listings[repositoryAddress][tokenId] = Listing({
            developer: msg.sender,
            price: price
        });

        // Emit event for the frontend
        emit SoftwareListed(repositoryAddress, tokenId, msg.sender, price);
    }

    // TODO buySoftware -> results in minting a license for software ERC_5521
    /// @notice Buy a software license
    /// @param repository The repository contract that owns the software NFT
    /// @param tokenId The token ID of the software NFT
    /// @return licenseId The ID of the newly minted license
    function buySoftware(
        address repository,
        uint256 tokenId
    ) public payable isListed(repository, tokenId) returns (uint256) {
        // Check if the buyer is not the seller
        require(
            listings[repository][tokenId].developer != msg.sender,
            "Cannot buy your own software"
        );

        // Check if the buyer has enough funds
        uint256 price = listings[repository][tokenId].price;
        require(msg.value >= price, "Not enough funds");

        // Transfer the payment to the developer
        payable(listings[repository][tokenId].developer).transfer(msg.value);

        // Mint a license for the buyer through the Registry
        uint256 licenseId = registry.mintLicense(
            msg.sender,
            listings[repository][tokenId].developer,
            tokenId
        );

        // Emit event for the frontend
        emit LicensePurchased(
            msg.sender,
            repository,
            tokenId,
            licenseId,
            price
        );

        return licenseId;
    }

    // TODO cancelSoftware -> cancel listing

    // TODO transferLicense -> transfer license to another address
}
