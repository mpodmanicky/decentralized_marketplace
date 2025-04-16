import React, { useState, useContext } from "react";
import { Card, Button, Badge, Spinner } from "react-bootstrap";
import { ethers } from "ethers";
import { Web3Context } from "../../contexts/Web3Context";

const SoftwareListing = ({ software }) => {
  const { marketplace, account } = useContext(Web3Context);
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);

      // Create transaction to buy software
      const tx = await marketplace.buySoftware(
        software.repository,
        software.tokenId,
        { value: software.price }
      );

      // Wait for transaction to be mined
      await tx.wait();

      alert("Software purchased successfully!");
      setIsLoading(false);
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Error purchasing software: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-100 mb-4">
      <Card.Body>
        <Card.Title>{software.name || `Software #${software.tokenId}`}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {ethers.utils.formatEther(software.price)} ETH
        </Card.Subtitle>
        <Card.Text>
          {software.description || "No description available"}
        </Card.Text>

        {software.dependencies && software.dependencies.length > 0 && (
          <div className="mb-3">
            <p className="mb-1">Dependencies:</p>
            {software.dependencies.map((dep, idx) => (
              <Badge bg="secondary" className="me-1" key={idx}>
                Software #{dep}
              </Badge>
            ))}
          </div>
        )}

        <Button
          variant="primary"
          onClick={handlePurchase}
          disabled={isLoading || !account}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="ms-2">Processing...</span>
            </>
          ) : (
            `Buy for ${ethers.utils.formatEther(software.price)} ETH`
          )}
        </Button>
      </Card.Body>
      <Card.Footer>
        <small className="text-muted">
          Owner: {software.developer.substring(0, 6)}...{software.developer.substring(software.developer.length - 4)}
        </small>
      </Card.Footer>
    </Card>
  );
};

export default SoftwareListing;
