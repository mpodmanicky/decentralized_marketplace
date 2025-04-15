// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

import "./Repository.sol";

/// @title Registry
/// @notice This contract manages the registration of developers and their software, allows minting and manages
/// references between software
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Registry is IERC721Receiver {
    address private immutable owner;
    uint256 private repositoryCounter;
    uint256 private count;
    uint256 private licenseCounter;
    address  marketplace;

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        // Simply accept all ERC721 transfers
        return this.onERC721Received.selector;
    }

    // array of developer contracts
    mapping(address => bool) private repositories; // saving gas

    // stores wallet Address asociated with developer contract
    mapping(address => address) private walletToRepository;

    // stores developer contract address asociated with software tokenIds
    // mapping(address => uint256[]) private repositoryToTokenIds;
    // For optimal gas usage, we will query the repository contract for the token IDs

    // Event to emit when minted a software
    event SoftwareMinted(
        address indexed developer,
        uint256 indexed softwareId,
        string tokenURI
    );

    constructor() {
        owner = msg.sender;
        repositoryCounter = 0;
        count = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "Not the marketplace");
        _;
    }

    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
    }

    /// @notice Register a new developer/repo contract
    /// @dev This function allows a developer to register their contract/create repo, finally the registry is owner of all other contracts
    function createRepository() external {
        require(
            walletToRepository[msg.sender] == address(0),
            "Developer already registered"
        );
        Repository newRepository = new Repository(address(this));
        repositories[address(newRepository)] = true;
        walletToRepository[msg.sender] = address(newRepository);
        repositoryCounter++;
    }

    function mintSoftware(
        string memory _tokenURI,
        address[] memory addresses,
        uint256[][] memory _tokenIds
    ) external returns (uint256) {
        require(
            walletToRepository[msg.sender] != address(0),
            "Only developers can mint"
        );
        // can add if statement which then creates a developer contract if not exists
        Repository repository = Repository(walletToRepository[msg.sender]);
        uint256 tokenId = repository.mintSoftware(
            count,
            _tokenURI,
            addresses,
            _tokenIds
        );
        // repositoryToTokenIds[address(repository)].push(tokenId);
        count++;
        emit SoftwareMinted(msg.sender, tokenId, _tokenURI);

        return tokenId;
    }

    event LicenseMinted(
        address indexed buyer,
        address indexed developer,
        uint256 indexed softwareId,
        uint256 licenseId
    );

    /// @notice Mint a license for a software
    /// @param buyer The address that will own the license
    /// @param developer The developer who listed the software
    /// @param softwareId The ID of the software being licensed
    /// @return licenseId The ID of the newly minted license
    function mintLicense(
        address buyer,
        address developer,
        uint256 softwareId
    ) external onlyMarketplace returns (uint256) {
        require(
            walletToRepository[developer] != address(0),
            "Developer not registered"
        );

        Repository repository = Repository(walletToRepository[developer]);

        // Generating unique license ID across all repositories
        uint256 licenseId = licenseCounter + 100000;
        licenseCounter++;

        // Call the repository to mint the license
        uint256 mintedLicenseId = repository.mintLicense(
            buyer,
            softwareId,
            licenseId
        );

        emit LicenseMinted(buyer, address(repository), softwareId, licenseId);

        return mintedLicenseId;
    }

    function isRepository(
        address _repositoryAddress
    ) public view returns (bool) {
        return repositories[_repositoryAddress];
    }

    function isDeveloper(address _sender) external view returns (bool) {
        return walletToRepository[_sender] != address(0);
    }

    function getRepositoryContract(
        address _sender
    ) external view returns (address) {
        return walletToRepository[_sender];
    }

    // Check the ownership of the tokenId TODO
    // function ownership(address _sender, uint256 _tokenId) external view returns (bool) {
    //     address repo = walletToRepository[_sender];
    // }
    /// @notice Check if the repository owns the software
    function repositoryOwnsSoftware(
        address _repository,
        uint256 _tokenId
    ) external view returns (bool) {
        require(repositories[_repository], "Not a registered repository");
        Repository repository = Repository(_repository);
        return repository.ownerOf(_tokenId) == _repository;
    }

}
