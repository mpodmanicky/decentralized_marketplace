import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <Container className="mt-5">
      <Row className="text-center mb-5">
        <Col>
          <h1>Decentralized Software Marketplace</h1>
          <p className="lead">
            Buy, sell, and mint software with transparent dependency tracking and licensing.
          </p>
        </Col>
      </Row>

      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Find Software</Card.Title>
              <Card.Text>
                Browse through our marketplace to discover software created by developers around the world.
              </Card.Text>
              <Link to="/marketplace">
                <Button variant="primary">Browse Marketplace</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Sell Your Software</Card.Title>
              <Card.Text>
                Register as a developer and mint your software as NFTs to sell on the marketplace.
              </Card.Text>
              <Link to="/developer">
                <Button variant="primary">Developer Dashboard</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Manage Your Licenses</Card.Title>
              <Card.Text>
                View and manage all your purchased software licenses in one place.
              </Card.Text>
              <Link to="/licenses">
                <Button variant="primary">My Licenses</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col>
          <Card bg="light">
            <Card.Body>
              <Card.Title>How It Works</Card.Title>
              <ol>
                <li>Connect your wallet to access the marketplace features</li>
                <li>Register as a developer to create and sell software</li>
                <li>Mint your software with proper dependency references</li>
                <li>List your software on the marketplace</li>
                <li>Earn royalties when others use your software as dependencies</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
