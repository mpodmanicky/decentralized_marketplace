import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Web3Context } from "../contexts/Web3Context";
import SoftwareListing from "../components/marketplace/SoftwareListing";

const MarketplacePage = () => {
  const { marketplace, provider, getRepositoryContract } = useContext(Web3Context);
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
        console.log("Found listing events:", events.length);

        // Create a function to check if a listing is still active
        const checkIfStillListed = async (repositoryAddress, tokenId) => {
          try {
            // Since isListed is a modifier, we need a different approach
            // We can query the listings mapping directly if there's a public getter
            // If not, we need to create one in the contract or use an alternative approach

            // Option 1: If you add a checkIsListed function to your contract:
            // return await marketplace.checkIsListed(repositoryAddress, tokenId);

            // Option 2: If you don't want to modify your contract, use a try-catch approach
            // with a dummy function call that uses the isListed modifier
            try {
              // This will throw an error with "Not listed" if the software is not listed
              // You would need to add this view function to your contract
              const price = await marketplace.getListingPrice(repositoryAddress, tokenId);
              return price.gt(0); // If price > 0, it's listed
            } catch (err) {
              if (err.message.includes("Not listed")) {
                return false;
              }
              throw err; // Re-throw if it's a different error
            }
          } catch (error) {
            console.warn(`Error checking if ${repositoryAddress}:${tokenId} is still listed:`, error);
            return false;
          }
        };

        // Process all events to get listings
        const processedListings = [];
        for (const event of events) {
          try {
            // Extract event arguments
            const repositoryAddress = event.args.nftContract;
            const tokenId = event.args.tokenId;
            const developer = event.args.developer;
            const price = event.args.price;

            console.log(`Processing listing: ${repositoryAddress}:${tokenId} by ${developer}`);

            // Check if still listed
            const isStillListed = await checkIfStillListed(repositoryAddress, tokenId);

            if (!isStillListed) {
              console.log(`Listing ${repositoryAddress}:${tokenId} is no longer active`);
              continue;
            }

            // Get repository contract to fetch metadata
            const repositoryContract = await getRepositoryContract(repositoryAddress);

            // Get token metadata
            let name = `Software #${tokenId}`;
            let description = "No description available";

            try {
              const tokenURI = await repositoryContract.tokenURI(tokenId);
              console.log(`Token URI for ${tokenId}:`, tokenURI);

              // Parse metadata
              if (tokenURI) {
                let metadata;
                if (tokenURI.startsWith('data:application/json;base64,')) {
                  const base64 = tokenURI.split(',')[1];
                  const decoded = atob(base64);
                  metadata = JSON.parse(decoded);
                } else if (tokenURI.startsWith('{')) {
                  metadata = JSON.parse(tokenURI);
                }

                if (metadata) {
                  name = metadata.name || name;
                  description = metadata.description || description;
                }
              }
            } catch (err) {
              console.warn(`Error fetching metadata for ${tokenId}:`, err);
            }

            // Add to processed listings
            processedListings.push({
              id: `${repositoryAddress}-${tokenId}`,
              repositoryAddress,
              tokenId: tokenId.toString(),
              developer,
              price,
              name,
              description
            });

          } catch (err) {
            console.error("Error processing event:", err);
          }
        }

        console.log("Processed listings:", processedListings);
        setListings(processedListings);

      } catch (error) {
        console.error("Error fetching listings:", error);
        setError("Failed to load marketplace listings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [marketplace, provider, getRepositoryContract]);

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
          {listings.map((listing) => (
            <Col key={listing.id}>
              <SoftwareListing software={listing} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MarketplacePage;
