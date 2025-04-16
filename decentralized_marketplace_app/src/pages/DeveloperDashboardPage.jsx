import React, { useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Web3Context } from "../contexts/Web3Context";
import CreateRepository from "../components/developer/CreateRepository";
import MintSoftware from "../components/developer/MintSoftware";
import ListSoftware from "../components/developer/ListSoftware"; // Import the new component

const DeveloperDashboardPage = () => {
  const { account } = useContext(Web3Context);

  if (!account) {
    return (
      <Container className="mt-4">
        <h1>Developer Dashboard</h1>
        <p>Please connect your wallet to access the developer dashboard.</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h1>Developer Dashboard</h1>

      <Row className="mt-4">
        <Col md={12}>
          <CreateRepository />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <MintSoftware />
        </Col>
      </Row>

      {/* Add the new ListSoftware component */}
      <Row className="mt-4">
        <Col md={12}>
          <ListSoftware />
        </Col>
      </Row>
    </Container>
  );
};

export default DeveloperDashboardPage;
