import React, { useContext } from "react";
import { Navbar, Container, Nav, Button, ButtonGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Web3Context } from "../../contexts/Web3Context";

const Header = () => {
  const {
    account,
    connectWallet,
    disconnectWallet,
    connectHardhatWallet,
    isDeveloper,
    loading,
    isHardhatWallet
  } = useContext(Web3Context);

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Decentralized Software Marketplace
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/marketplace">
              Marketplace
            </Nav.Link>
            {isDeveloper && (
              <Nav.Link as={Link} to="/developer">
                Developer Dashboard
              </Nav.Link>
            )}
            {account && (
              <Nav.Link as={Link} to="/licenses">
                My Licenses
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            {!account ? (
              <ButtonGroup>
                <Button
                  onClick={connectWallet}
                  disabled={loading}
                  variant="outline-light"
                >
                  {loading ? "Connecting..." : "Connect MetaMask"}
                </Button>
                <Button
                  onClick={connectHardhatWallet}
                  disabled={loading}
                  variant="outline-info"
                >
                  Connect Hardhat Wallet
                </Button>
              </ButtonGroup>
            ) : (
              <div className="d-flex align-items-center">
                <span className="text-light me-3">
                  {isHardhatWallet ? "(Hardhat) " : ""}
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
                <Button
                  variant="outline-danger"
                  onClick={disconnectWallet}
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
