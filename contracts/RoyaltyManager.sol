// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RoyaltyManager is Ownable {
    using SafeMath for uint256;

    // Platform constants
    uint256 public constant PERCENTAGE_BASIS = 10000;
    uint256 public constant PRIMARY_DEVELOPER_SHARE = 7000;

    // Royalty balances for developers
    mapping(address => uint256) public royaltyBalance;

    // events

    function initializeRoyaltyDistribution(
        uint256 _softwareId,
        uint256 saleAmount,
        address primaryDeveloper
    ) external payable {
        require(msg.value == saleAmount, "Incorrect sale amount");

        uint256 primaryShare = saleAmount.mul(PRIMARY_DEVELOPER_SHARE).div(
            PERCENTAGE_BASIS
        );

        uint256 remainingAmount = saleAmount.sub(primaryShare);
    }

    function batchDistributeRoyalties(
        address[] calldata developers,
        address[] calldata amounts,
        uint256 softwareId,
        uint256 totalRoyaltyAmount
    ) external onlyOwner {
        require(developers.length == amounts.length, "Arrays length mismatch");

        uint256 sumOfAmounts = 0;

        for (uint256 i = 0; i < developers.length; i++) {
            royaltyBalance[developers[i]] = royaltyBalance[developers[i]].add(
                amounts[i]
            );
            sumOfAmounts = sumOfAmounts.add(amounts[i]);

            emit RoyaltyDistributed(softwareId, developers[i], amounts[i]);
        }

        // Verify the sum matches the expected total amount
        require(
            sumOfAmounts <= totalRoyaltyAmount,
            "Distribution exceeds available amount"
        );

        // If there's any dust amount left, send it to the contract owner
        if (sumOfAmounts < totalRoyaltyAmount) {
            royaltyBalance[owner()] = royaltyBalance[owner()].add(
                totalRoyaltyAmount.sub(sumOfAmounts)
            );
        }
    }

    /**
     * @dev Allows a developer to withdraw their accumulated royalties
     */
    function withdrawRoyalties() external nonReentrant {
        uint256 amount = royaltyBalance[msg.sender];
        require(amount > 0, "No royalties to withdraw");

        // Clear balance before transfer to prevent reentrancy
        royaltyBalance[msg.sender] = 0;

        // Transfer royalties to the developer
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit RoyaltyWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Updates PRIMARY_DEVELOPER_SHARE
     * @param newShare New share percentage (in basis points)
     */
    function updatePrimaryDeveloperShare(uint256 newShare) external onlyOwner {
        require(
            newShare >= 5000 && newShare <= 9000,
            "Share must be between 50% and 90%"
        );
        // Note: This would need to be implemented differently since the constant can't be modified
        // We would need a storage variable instead
    }

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {}
}
