import React, { useState, useEffect, useContext } from "react";
import { Button, Card, Form, Spinner, ListGroup, Badge, Alert } from "react-bootstrap";
import { Web3Context } from "../../contexts/Web3Context";
import { ethers } from "ethers";

const ListSoftware = () => {
  const { registry, marketplace, account, isDeveloper, getRepositoryContract } = useContext(Web3Context);
  const [loading, setLoading] = useState(false);
  const [fetchingTokens, setFetchingTokens] = useState(true);
  const [myTokens, setMyTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [price, setPrice] = useState("");
  const [error, setError] = useState(null);
  const [repositoryAddress, setRepositoryAddress] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch user's repository and tokens
  useEffect(() => {
    const fetchUserRepository = async () => {
      if (!registry || !account || !isDeveloper) return;

      try {
        setFetchingTokens(true);
        console.log("Fetching repository for account:", account);

        // Get the repository address for the connected account
        const repoAddress = await registry.getRepositoryContract(account);
        console.log("Repository address:", repoAddress);
        setRepositoryAddress(repoAddress);

        if (repoAddress === ethers.ZeroAddress) {
          console.log("No repository found for this account");
          setFetchingTokens(false);
          return;
        }

        // Get the repository contract
        const repositoryContract = await getRepositoryContract(repoAddress);
        console.log("Repository contract:", repositoryContract);

        // Fetch the tokens owned by this repository
        const tokenCount = await repositoryContract.softwareCount();
        console.log("Total tokens in repository:", tokenCount.toString());

        const tokens = [];

        // Start from 1 as most NFTs start ID from 1
        for (let i = 1; i <= tokenCount; i++) {
          try {
            // Try to get token URI - if this succeeds, the token exists
            const ownerOf = await repositoryContract.ownerOf(i);
            console.log(`Token ${i} owner:`, ownerOf);


            console.log(`Found token ${i}`);

            // Get token metadata
            const tokenURI = await repositoryContract.tokenURI(i);
            console.log(`Token ${i} URI:`, tokenURI);

            // Determine if this token is already listed
            let isListed = false;
            try {
              isListed = await marketplace.isListed(repoAddress, i);
              console.log(`Token ${i} is listed:`, isListed);
            } catch (err) {
              console.warn(`Error checking if token ${i} is listed:`, err);
            }

            // Try parsing metadata
            let metadata = {
              name: `Software #${i}`,
              description: "No description available"
            };

            try {
              // Handle different URI formats
              if (tokenURI.startsWith('data:application/json;base64,')) {
                const base64 = tokenURI.split(',')[1];
                const decoded = atob(base64);
                metadata = JSON.parse(decoded);
              } else if (tokenURI.startsWith('{')) {
                // Direct JSON string
                metadata = JSON.parse(tokenURI);
              }
            } catch (err) {
              console.warn(`Failed to parse token ${i} URI:`, err);
            }

            // Add token to the list regardless of ownership - since it's in your repository
            tokens.push({
              id: i,
              name: metadata.name || `Software #${i}`,
              description: metadata.description || "No description available",
              isListed
            });
          } catch (err) {
            console.warn(`Error processing token ${i}:`, err.message);
          }
        }

        console.log("Found tokens:", tokens);
        setMyTokens(tokens);
      } catch (err) {
        console.error("Error fetching tokens:", err);
        setError("Failed to fetch your software tokens: " + err.message);
      } finally {
        setFetchingTokens(false);
      }
    };

    fetchUserRepository();
  }, [registry, account, isDeveloper, getRepositoryContract]);

  // Handler for listing a token on the marketplace
  const handleListSoftware = async (e) => {
    e.preventDefault();
    if (!selectedToken || !price || price <= 0) {
      setError("Please select a software and set a valid price");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Convert price to wei
      const priceInWei = ethers.parseEther(price);
      console.log("Listing software:", selectedToken, "for price:", priceInWei.toString());

      // Call the marketplace.listSoftware function with the correct parameters
      // No need for approval since the marketplace doesn't transfer the token
      const listTx = await marketplace.listSoftware(
        selectedToken, // tokenId
        priceInWei,    // price
        { gasLimit: 3000000 }
      );

      console.log("Listing transaction sent:", listTx.hash);
      const listReceipt = await listTx.wait();
      console.log("Software listed successfully, receipt:", listReceipt);

      // Update UI
      setSuccess(true);
      // Update the token status in the list
      setMyTokens(myTokens.map(token =>
        token.id === selectedToken
          ? { ...token, isListed: true }
          : token
      ));

      // Reset form
      setSelectedToken(null);
      setPrice("");
    } catch (err) {
      console.error("Error listing software:", err);
      setError(`Failed to list software: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isDeveloper) {
    return (
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>List Software</Card.Title>
          <Alert variant="warning">
            You need to register as a developer before you can list software.
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>List Your Software</Card.Title>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
            Software listed successfully!
          </Alert>
        )}

        <div className="mb-3">
          <strong>Repository Address:</strong> {repositoryAddress || "Not found"}
        </div>

        {fetchingTokens ? (
          <div className="text-center p-3">
            <Spinner animation="border" />
            <p className="mt-2">Fetching your software...</p>
          </div>
        ) : myTokens.length === 0 ? (
          <Alert variant="info">
            No software tokens found in your repository. Mint some software first!
          </Alert>
        ) : (
          <>
            <Form onSubmit={handleListSoftware}>
              <Form.Group className="mb-3">
                <Form.Label>Select Software to List</Form.Label>
                <Form.Select
                  value={selectedToken || ""}
                  onChange={(e) => setSelectedToken(parseInt(e.target.value))}
                  required
                >
                  <option value="">-- Select Software --</option>
                  {myTokens.map((token) => (
                    <option
                      key={token.id}
                      value={token.id}
                      disabled={token.isListed}
                    >
                      {token.name} {token.isListed ? "(Already Listed)" : ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Price (ETH)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Enter price in ETH"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                disabled={loading || !selectedToken}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Listing...</span>
                  </>
                ) : (
                  "List Software"
                )}
              </Button>
            </Form>

            <hr />

            <h5>Your Software</h5>
            <ListGroup>
              {myTokens.map((token) => (
                <ListGroup.Item
                  key={token.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{token.name}</strong>
                    <p className="mb-0 text-muted small">{token.description}</p>
                  </div>
                  <Badge bg={token.isListed ? "success" : "secondary"}>
                    {token.isListed ? "Listed" : "Not Listed"}
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ListSoftware;
