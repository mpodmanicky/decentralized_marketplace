****# Decentralized Marketplace for Software Licenses
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

#### Exponential Decay Algorithm
Each level of references gets a decaying percentage of the royalty pool, which can later be extended with a usage metrics to better determine the royalty distribution.

Single transaction to distribute all royalties for gas efficiency.

Automatic combining of multiple contributions from the same developer.

Why exponential decay algorithm?

It is just one approach among several that could be used for distributing royalties across multiple levels of software dependencies.
1. Natural Representation of infulence: The exponential decay model reflects the diminishing influence of indirect dependencies. A direct dependency (level 1) has more immediate impact on a software product than a dependency that is several levels bellow.
2. Mathematical Simplicity: The formula is contribution = baseValue x (decayFactor)^depth. This makes calculations predictable and easy to understand.
3. Automatic Limiting: As depth increases, the share naturally approaches zero without needing a hard cutoff. This handles arbitrarly deep dependency chains elegantly.
4. Balanced Distribution: It ensures that deeper dependencies still receive compensation, but appropriately smaller amounts compared to direct dependencies.

As an alternative we could use **Hyperbolic Decay** (1/n) using inverse relationship between depth and contribution.

Pros:
- Natural asymptotic approach to zero without hard cutoff
- Slower decay than exponential for initial levels
Cons:
- Very distant dependencies still get non-trivial shares
- Might need to cap depth in practice

Another algorithm would be Logarithmic Decay where contribution decreases logarigthmically with depth.

Pros:
- More Gradual decay than exponential
- Works well when deeper dependencies still have meaningful impact
Cons:
- Decays too slowly for very deep hiearachies
- Mays still require maximum depth limit

```// Logarithmic decay - slower reduction at deeper levels
const baseValue = 10;
const contributionScore = baseValue / Math.log(depth + 1);
```

### Current Gas
*check gas-report.txt*, storing the current gas fees to the *marketplace.test.js*

### TODO
1. Royalty distribution within the contracts
2. Implement all funcitonality to the frontend application
3. Security verification
4. Final Document
