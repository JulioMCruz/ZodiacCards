// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title ZodiacImagePayment
 * @dev Payment contract for Zodiac Card image generation on Celo network
 * @notice Handles 2 CELO payments for image generation with user collection tracking
 * @notice Upgradeable via UUPS pattern, includes ReentrancyGuard and Pausable
 */
contract ZodiacImagePayment is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // Image generation fee in native CELO (18 decimals) - 2 CELO
    uint256 public constant IMAGE_FEE = 2 ether;

    // Treasury address for fee collection
    address payable public treasuryAddress;

    // Global statistics
    uint256 public totalPayments;
    uint256 public totalFeesCollected;

    // User statistics
    mapping(address => uint256) public userPaymentCount;
    mapping(address => uint256) public userTotalPaid;

    // Payment tracking
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public userPaymentIds;

    struct Payment {
        address user;
        uint256 amount;
        uint256 timestamp;
        string imageS3Key; // Can be set later after image is generated
        bool imageGenerated;
    }

    // Events
    event ImagePaymentReceived(
        address indexed user,
        uint256 indexed paymentId,
        uint256 amount,
        uint256 timestamp
    );

    event ImageGenerated(
        uint256 indexed paymentId,
        address indexed user,
        string imageS3Key
    );

    event TreasuryAddressUpdated(address newTreasury);
    event FeesWithdrawn(address to, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address payable initialTreasury
    ) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        require(initialTreasury != address(0), "Invalid treasury address");
        treasuryAddress = initialTreasury;
    }

    /**
     * @dev User pays for image generation
     * @return paymentId Unique payment identifier
     */
    function payForImage() external payable nonReentrant whenNotPaused returns (uint256 paymentId) {
        require(msg.value >= IMAGE_FEE, "Insufficient CELO sent");

        // Increment global counter
        paymentId = ++totalPayments;
        totalFeesCollected += msg.value;

        // Update user statistics
        userPaymentCount[msg.sender]++;
        userTotalPaid[msg.sender] += msg.value;
        userPaymentIds[msg.sender].push(paymentId);

        // Store payment details
        payments[paymentId] = Payment({
            user: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            imageS3Key: "",
            imageGenerated: false
        });

        // Transfer native CELO to treasury
        (bool sent, ) = treasuryAddress.call{value: msg.value}("");
        require(sent, "Failed to send CELO to treasury");

        emit ImagePaymentReceived(msg.sender, paymentId, msg.value, block.timestamp);

        return paymentId;
    }

    /**
     * @dev Mark image as generated (called by backend or oracle)
     * @param paymentId Payment ID
     * @param imageS3Key S3 key for generated image
     */
    function markImageGenerated(
        uint256 paymentId,
        string memory imageS3Key
    ) external onlyOwner {
        require(paymentId > 0 && paymentId <= totalPayments, "Invalid payment ID");
        require(!payments[paymentId].imageGenerated, "Image already marked as generated");

        payments[paymentId].imageS3Key = imageS3Key;
        payments[paymentId].imageGenerated = true;

        emit ImageGenerated(paymentId, payments[paymentId].user, imageS3Key);
    }

    /**
     * @dev Get user's payment history
     * @param user User address
     * @return Array of payment IDs
     */
    function getUserPayments(address user) external view returns (uint256[] memory) {
        return userPaymentIds[user];
    }

    /**
     * @dev Get payment details
     * @param paymentId Payment ID
     * @return Payment struct
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        require(paymentId > 0 && paymentId <= totalPayments, "Invalid payment ID");
        return payments[paymentId];
    }

    /**
     * @dev Get multiple payment details
     * @param paymentIds Array of payment IDs
     * @return Array of Payment structs
     */
    function getPayments(uint256[] calldata paymentIds) external view returns (Payment[] memory) {
        Payment[] memory result = new Payment[](paymentIds.length);
        for (uint256 i = 0; i < paymentIds.length; i++) {
            require(paymentIds[i] > 0 && paymentIds[i] <= totalPayments, "Invalid payment ID");
            result[i] = payments[paymentIds[i]];
        }
        return result;
    }

    /**
     * @dev Get user statistics
     * @param user User address
     * @return paymentCount Total number of payments
     * @return totalPaid Total CELO paid
     */
    function getUserStats(address user) external view returns (
        uint256 paymentCount,
        uint256 totalPaid
    ) {
        return (userPaymentCount[user], userTotalPaid[user]);
    }

    // Owner functions
    function setTreasuryAddress(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = newTreasury;
        emit TreasuryAddressUpdated(newTreasury);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool sent, ) = treasuryAddress.call{value: balance}("");
        require(sent, "Failed to withdraw fees");

        emit FeesWithdrawn(treasuryAddress, balance);
    }

    /**
     * @dev Pause contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // Required override for UUPS
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Receive function to accept CELO
    receive() external payable {}
}
