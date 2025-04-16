import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Web3Context } from "../contexts/Web3Context";
import SoftwareListing from "../components/marketplace/SoftwareListing";

const MarketplacePage = () => {
  const { marketplace, provider } = useContext(Web3Context);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      if (!marketplace || !provider) return;

      try {
        setIsLoading(true);

        // Get past events for SoftwareListed
        const filter = marketplace.filters.SoftwareListed();
        const events = await marketplace.queryFilter(filter);

        // Map events to listings
        const listedSoftware = await Promise.all(
          events.map(async (event) => {
            const { developer, repository, tokenId, price } = event.args;

            // Check if software is still listed
            try {
              // This assumes your marketplace contract has a function to check if software is listed
              const isStillListed = await marketplace.isListed(repository, tokenId);
              if (!isStillListed) return null;

              return {
                developer,
                repository,
                tokenId: tokenId.toString(),
                price,
                // Add more details as needed
              };
            } catch (error) {
              console.error("Error checking listing:", error);
              return null;
            }
          })
        );

        // Filter out null values (software no longer listed)
        setListings(listedSoftware.filter(item => item !== null));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setError("Failed to load marketplace listings");
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [marketplace, provider]);

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading marketplace listings...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h1>Software Marketplace</h1>

      {listings.length === 0 ? (
        <Alert variant="info">
          No software currently listed on the marketplace.
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4 mt-3">
          {listings.map((listing, idx) => (
            <Col key={`${listing.repository}-${listing.tokenId}`}>
              <SoftwareListing software={listing} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MarketplacePage;
