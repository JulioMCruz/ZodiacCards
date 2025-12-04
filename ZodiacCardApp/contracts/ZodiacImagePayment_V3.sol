// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title ZodiacImagePayment V3
 * @dev Payment contract for Zodiac Card image generation on Celo network
 * @notice V3: Added IPFS metadata storage and minting status tracking
 * @notice Handles 2 CELO payments for image generation with on-chain collection
 * @notice Upgradeable via UUPS pattern, includes ReentrancyGuard and Pausable
 */
contract ZodiacImagePayment_V3 is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // Image generation fee in native CELO (18 decimals) - 2 CELO
    uint256 public imageFee;

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

    // V3: Generation tracking with IPFS metadata
    struct Generation {
        string metadataURI;      // IPFS URI with fortune + image data
        uint256 tokenId;         // NFT token ID (0 if not minted yet)
        bool isMinted;           // Minting status
        uint256 createdAt;       // Generation timestamp
        uint256 mintedAt;        // Minting timestamp (0 if not minted)
    }

    // V3: Mapping from paymentId to Generation data
    mapping(uint256 => Generation) public generations;

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

    // V3: New events
    event GenerationStored(
        uint256 indexed paymentId,
        address indexed user,
        string metadataURI,
        uint256 timestamp
    );

    event GenerationMinted(
        uint256 indexed paymentId,
        address indexed user,
        uint256 indexed tokenId,
        uint256 timestamp
    );

    event TreasuryAddressUpdated(address newTreasury);
    event FeesWithdrawn(address to, uint256 amount);
    event ImageFeeUpdated(uint256 newFee);

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
        imageFee = 2 ether; // 2 CELO default
    }

    /**
     * @dev User pays for image generation
     * @return paymentId Unique payment identifier
     */
    function payForImage() external payable nonReentrant whenNotPaused returns (uint256 paymentId) {
        require(msg.value >= imageFee, "Insufficient CELO sent");

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
     * @dev V3: Store generation metadata on-chain (called by backend after fortune + image generation)
     * @param paymentId Payment ID
     * @param metadataURI IPFS URI containing fortune text and image URL
     */
    function storeGeneration(
        uint256 paymentId,
        string memory metadataURI
    ) external {
        require(paymentId > 0 && paymentId <= totalPayments, "Invalid payment ID");
        require(
            payments[paymentId].user == msg.sender || msg.sender == owner(),
            "Not payment owner or contract owner"
        );
        require(bytes(generations[paymentId].metadataURI).length == 0, "Generation already stored");
        require(bytes(metadataURI).length > 0, "Empty metadata URI");

        address paymentOwner = payments[paymentId].user;

        generations[paymentId] = Generation({
            metadataURI: metadataURI,
            tokenId: 0,
            isMinted: false,
            createdAt: block.timestamp,
            mintedAt: 0
        });

        emit GenerationStored(paymentId, paymentOwner, metadataURI, block.timestamp);
    }

    /**
     * @dev V3: Mark generation as minted (called after NFT minting)
     * @param paymentId Payment ID
     * @param tokenId NFT token ID
     */
    function markAsMinted(
        uint256 paymentId,
        uint256 tokenId
    ) external {
        require(paymentId > 0 && paymentId <= totalPayments, "Invalid payment ID");
        require(payments[paymentId].user == msg.sender, "Not payment owner");
        require(bytes(generations[paymentId].metadataURI).length > 0, "Generation not stored");
        require(!generations[paymentId].isMinted, "Already minted");
        require(tokenId > 0, "Invalid token ID");

        generations[paymentId].tokenId = tokenId;
        generations[paymentId].isMinted = true;
        generations[paymentId].mintedAt = block.timestamp;

        emit GenerationMinted(paymentId, msg.sender, tokenId, block.timestamp);
    }

    /**
     * @dev V3: Get user's collection (all generations and their status)
     * @param user User address
     * @return paymentIds Array of payment IDs
     * @return generationData Array of Generation structs
     */
    function getUserCollection(address user) external view returns (
        uint256[] memory paymentIds,
        Generation[] memory generationData
    ) {
        uint256[] memory userIds = userPaymentIds[user];
        Generation[] memory data = new Generation[](userIds.length);

        for (uint256 i = 0; i < userIds.length; i++) {
            data[i] = generations[userIds[i]];
        }

        return (userIds, data);
    }

    /**
     * @dev V3: Get generation data
     * @param paymentId Payment ID
     * @return Generation struct
     */
    function getGeneration(uint256 paymentId) external view returns (Generation memory) {
        require(paymentId > 0 && paymentId <= totalPayments, "Invalid payment ID");
        return generations[paymentId];
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

    /**
     * @dev V3: Update image fee
     * @param newFee New fee amount in wei
     */
    function setImageFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Fee must be greater than 0");
        imageFee = newFee;
        emit ImageFeeUpdated(newFee);
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
