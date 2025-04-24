# Decentralized Marketplace for Software Licenses
Proposing an enhanced version to decentralized marketplace for software licenses using referable NFT (ERC-5521) from eip.ethereum.org.
### Contents
- Registry = This smart-contract has is one authority which controls deployments and manages references between software.
- Repository = Smart-contract posing as a repository or folder for software of developers, who can mint Software as ERC-5521 NFT.
- Marketplace = Smart-contract used for listing and buying Software NFTs. On buy a new NFT is minted making a direct reference to the software NFT and assumes the position of a license to use.


When a developer wants to publish his software NFT he first must have a repository contract assigned to his wallet. Only then he is able to mint his software NFT.


### Goals
Main goal is to enhance the previous version which used ERC-1155 standard to show the use case of the ERC-5521 and that it can be done with this standard aswell. And be even more efficient when it comes to royalty distribution.

### Royalty Distribution
A proposition to use Indexer and off-chain royalty calculation which are then distributed among the developers referenced software. In their version they used a smart contract "Aggregator" which calculates the weight of the dependencies used in their software. Our version would me much simpler using a static royalty fee percentage from future sales. Each developer should recieve direct and indirect royalty percentage from sales. Direct meaning Software A references Software B, and indirect meaning Software C references Software A which references Software B. Indexer will listen to events such as minting and buying building his map which would then be used when buy event is triggered. Making the calculations off-chain to save on gas fees.

### Current Gas
*check gas-report.txt*, storing the current gas fees to the *marketplace.test.js*

### TODO
1. Royalty distribution within the contracts
2. Implement all funcitonality to the frontend application
3. Security verification
4. Final Document
