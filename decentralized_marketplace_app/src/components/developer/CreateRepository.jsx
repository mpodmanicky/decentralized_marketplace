import React, { useState, useContext } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { Web3Context } from "../../contexts/Web3Context";

const CreateRepository = () => {
  const { registry, account, isDeveloper } = useContext(Web3Context);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRepository = async () => {
    try {
      setIsLoading(true);
      const tx = await registry.createRepository({ gasLimit: 3000000 });
      await tx.wait();
      alert("Repository created successfully!");
      // Refresh the page to update developer status
      window.location.reload();
    } catch (error) {
      console.error("Error creating repository:", error);
      alert("Error creating repository: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isDeveloper) {
    return (
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Developer Status</Card.Title>
          <Card.Text>
            You are registered as a developer and can mint software.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Become a Developer</Card.Title>
        <Card.Text>
          Register as a developer to mint and sell software on the marketplace.
        </Card.Text>
        <Button
          variant="primary"
          onClick={handleCreateRepository}
          disabled={isLoading || !account}
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" />
              Creating...
            </>
          ) : (
            "Create Repository"
          )}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default CreateRepository;
