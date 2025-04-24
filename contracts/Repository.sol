// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

/// @title Developer
/// @dev This contract allows the minting of software tokens.
/// It inherits from the ERC_5521 contract.
import "./ERC_5521.sol";

contract Repository is ERC_5521 {
    address private immutable owner;
    uint256 private licenseCounter = 1000000;
    uint256 public softwareCount = 0;
    struct SoftwareMeta {
        address creator;
        string tokenURI;
        address[] deps;
        uint256[][] depTokenIds;
    }
    mapping(uint256 => SoftwareMeta) public softwareMeta; // tokenId => SoftwareMeta
    // TODO add a mapping to store the software NFTs
    // TODO add a mapping to store the software licenses
    mapping(uint256 => uint256[]) public softwareToLicenses; // tokenId => licenseId

    /// TODO registry is the owner [x]
    constructor(address _address) ERC_5521("Software", "SOF") {
        owner = _address;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    event ReferenceCreated(
        uint256 indexed tokenId,
        address[] addresses,
        uint256[][] tokenIds
    );

    /// @notice The token ID is automatically assigned based on the current counter.
    /// @param count The current token ID counter.
    /// @param _tokenURI The URI for the token metadata.
    /// @param addresses The addresses of the software dependencies.
    /// @param _tokenIds The token IDs of the software dependencies.
    /// @return tokenId The ID of the newly minted token.
    function mintSoftware(
        uint256 count,
        string memory _tokenURI,
        address[] memory addresses,
        uint256[][] memory _tokenIds
    ) public onlyOwner returns (uint256) {
        softwareMeta[softwareCount] = SoftwareMeta({
            creator: tx.origin,
            tokenURI: _tokenURI,
            deps: addresses,
            depTokenIds: _tokenIds
        });
        softwareCount++;
        safeMint(count, addresses, _tokenIds);
        _setTokenURI(count, _tokenURI);
        _transfer(msg.sender, address(this), count);
        // Emit event for reference creation
        emit ReferenceCreated(count, addresses, _tokenIds);
        return count;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    // TODO mint a license for the software when bought
    /// @notice Mint a license for the software
    /// @param licensee The address that will receive the license
    /// @param softwareId The software token ID
    /// @param licenseId The license token ID to create
    /// @return The license token ID
    function mintLicense(
        address licensee,
        uint256 softwareId,
        uint256 licenseId
    ) public onlyOwner returns (uint256) {
        // Validation
        require(_exists(softwareId), "Software does not exist");

        // Set up references to the software NFT
        address[] memory refAddresses = new address[](1);
        refAddresses[0] = address(this);

        uint256[][] memory refTokenIds = new uint256[][](1);
        uint256[] memory softwareIds = new uint256[](1);
        softwareIds[0] = softwareId; // Add the software ID to the array
        refTokenIds[0] = softwareIds; // Add the software IDs array to refTokenIds

        // Mint the license NFT with reference to the software NFT
        safeMint(licenseId, refAddresses, refTokenIds);

        // Set license URI based on software URI
        string memory softwareURI = tokenURI(softwareId);
        string memory licenseURI = string(
            abi.encodePacked("license-for-", softwareURI)
        );
        _setTokenURI(licenseId, licenseURI);

        // Track the license for this software
        softwareToLicenses[softwareId].push(licenseId);

        // Transfer the license to the licensee and emit
        _transfer(msg.sender, licensee, licenseId);
        //emit ReferenceCreated(licenseId, refAddresses, refTokenIds);
        return licenseId;
    }

    //TODO Utility functions
    // Check if a token ID is a license (vs software)
    function isLicense(uint256 tokenId) public pure returns (bool) {
        return tokenId >= 1000000;
    }


}
