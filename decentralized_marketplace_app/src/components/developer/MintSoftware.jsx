import React, { useState, useContext } from "react";
import { Form, Button, Card, Spinner, Container } from "react-bootstrap";
import { Web3Context } from "../../contexts/Web3Context";

const MintSoftware = () => {
  const { registry, account, isDeveloper } = useContext(Web3Context);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [newDep, setNewDep] = useState({ repo: "", tokenId: "" });

  const addDependency = () => {
    if (newDep.repo && newDep.tokenId) {
      setDependencies([...dependencies, { ...newDep }]);
      setNewDep({ repo: "", tokenId: "" });
    }
  };

  const removeDependency = (index) => {
    const updatedDeps = dependencies.filter((_, idx) => idx !== index);
    setDependencies(updatedDeps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDeveloper) {
      alert("You must be registered as a developer to mint software");
      return;
    }

    try {
      setIsLoading(true);

      // Prepare token URI (in a real app, you'd upload metadata to IPFS)
      const tokenURI = JSON.stringify({
        name,
        description,
        created: new Date().toISOString(),
      });

      // Prepare dependencies arrays
      const depAddresses = dependencies.map((dep) => dep.repo);
      const depTokenIds = dependencies.map((dep) => [dep.tokenId]);

      // Call the contract
      const tx = await registry.mintSoftware(
        tokenURI,
        depAddresses,
        depTokenIds,
        { gasLimit: 3000000 }
      );

      // Wait for transaction to be mined
      await tx.wait();

      alert("Software minted successfully!");
      setName("");
      setDescription("");
      setDependencies([]);
      setIsLoading(false);
    } catch (error) {
      console.error("Minting error:", error);
      alert("Error minting software: " + error.message);
      setIsLoading(false);
    }
  };

  if (!isDeveloper) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body>
            <Card.Title>Not Registered as Developer</Card.Title>
            <Card.Text>
              You need to register as a developer first to mint software.
            </Card.Text>
            <Button variant="primary" href="/developer">
              Register as Developer
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Mint New Software</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Software Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter software name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe your software"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Form.Group>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Dependencies</Card.Title>
              <Form.Group className="mb-3">
                <Form.Label>Repository Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="0x..."
                  value={newDep.repo}
                  onChange={(e) =>
                    setNewDep({ ...newDep, repo: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Token ID</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Token ID"
                  value={newDep.tokenId}
                  onChange={(e) =>
                    setNewDep({ ...newDep, tokenId: e.target.value })
                  }
                />
              </Form.Group>

              <Button
                variant="secondary"
                onClick={addDependency}
                className="mb-3"
              >
                Add Dependency
              </Button>

              {dependencies.length > 0 && (
                <div className="mt-3">
                  <h6>Added Dependencies:</h6>
                  <ul>
                    {dependencies.map((dep, idx) => (
                      <li key={idx}>
                        Repo: {dep.repo} - Token ID: {dep.tokenId}{" "}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeDependency(idx)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>

          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" />
                Minting...
              </>
            ) : (
              "Mint Software"
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default MintSoftware;
