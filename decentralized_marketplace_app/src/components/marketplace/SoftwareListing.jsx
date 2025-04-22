import React, { useContext, useState } from 'react';
import { Card, Button, Spinner, Alert } from 'react-bootstrap';
import { ethers } from 'ethers';
import { Web3Context } from '../../contexts/Web3Context';

const SoftwareListing = ({ software }) => {
  const { marketplace, account } = useContext(Web3Context);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Format price from wei to ETH
  const priceInEth = ethers.formatEther(software.price);

  const handlePurchase = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      console.log(`Purchasing license for software: ${software.repositoryAddress}:${software.tokenId}`);
      console.log(`Price: ${priceInEth} ETH`);

      // Call the marketplace contract's purchase function
      const tx = await marketplace.purchaseLicense(
        software.repositoryAddress,
        software.tokenId,
        {
          value: software.price, // Pass the exact price amount
          gasLimit: 3000000
        }
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Purchase successful:", receipt);

      setSuccess(true);
    } catch (err) {
      console.error("Error purchasing license:", err);
      setError(`Failed to purchase: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title>{software.name}</Card.Title>
        <Card.Text>{software.description}</Card.Text>
        <Card.Text className="fw-bold text-primary">Price: {priceInEth} ETH</Card.Text>

        {error && <Alert variant="danger" className="mt-2 mb-2">{error}</Alert>}
        {success && <Alert variant="success" className="mt-2 mb-2">Purchase successful!</Alert>}

        {account !== software.developer && (
          <Button
            variant="primary"
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-100"
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Processing...</span>
              </>
            ) : (
              "Purchase License"
            )}
          </Button>
        )}

        {account === software.developer && (
          <Alert variant="info" className="mb-0">
            You are the developer of this software
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default SoftwareListing;
