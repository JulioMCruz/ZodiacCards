// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ZodiacNFT V2
 * @dev NFT contract for Zodiac Card Farcaster mini app on Celo network
 * @notice V2: Reduced mint fee to 3 CELO (from 10 CELO) - backward compatible
 * @notice Upgradeable via UUPS pattern, includes ReentrancyGuard and Pausable
 */
contract ZodiacNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC2981Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using Strings for uint256;

    // Token ID counter
    uint256 private _nextTokenId;

    // Minting fee in native CELO (18 decimals) - V2: 3 CELO
    uint256 public mintFee;

    // Treasury address for fee collection
    address payable public treasuryAddress;

    // V2: Track NFT source for collection filtering
    enum MintSource {
        LegacyMint,      // Minted before V2 (10 CELO)
        DirectMint,      // V2: Directly minted (3 CELO) without prior image payment
        ImageToNFT       // V2: Minted after image generation (3 CELO + 2 CELO image = 5 CELO total)
    }

    // V2: Mapping to track mint source
    mapping(uint256 => MintSource) public tokenMintSource;

    // V2: Mapping to track associated image payment ID (for ImageToNFT only)
    mapping(uint256 => uint256) public tokenImagePaymentId;

    // Events
    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        string uri,
        MintSource source,
        uint256 imagePaymentId
    );
    event MintFeeUpdated(uint256 newFee);
    event TreasuryAddressUpdated(address newTreasury);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize V1 (backward compatible)
     */
    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialMintFee,
        address initialOwner,
        address payable initialTreasury
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC2981_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        mintFee = initialMintFee;
        _nextTokenId = 1;
        treasuryAddress = initialTreasury;

        // Set default royalty to 2.5%
        _setDefaultRoyalty(initialOwner, 250);
        transferOwnership(initialOwner);
    }

    /**
     * @dev V1 mint function (backward compatible)
     * @notice Legacy minting - automatically tagged as LegacyMint if fee is 10 CELO
     */
    function mint(address to, string memory metadataURI) public payable nonReentrant whenNotPaused returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(msg.value >= mintFee, "Insufficient CELO sent");

        // Transfer native CELO to treasury
        (bool sent, ) = treasuryAddress.call{value: msg.value}("");
        require(sent, "Failed to send CELO to treasury");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // V2: Determine source based on fee amount
        MintSource source = msg.value >= 9 ether ? MintSource.LegacyMint : MintSource.DirectMint;
        tokenMintSource[tokenId] = source;

        emit NFTMinted(to, tokenId, metadataURI, source, 0);

        return tokenId;
    }

    /**
     * @dev V2: Mint NFT after image generation payment
     * @param to Recipient address
     * @param metadataURI Metadata URI
     * @param imagePaymentId Associated image payment ID from ZodiacImagePayment contract
     * @return tokenId Minted token ID
     */
    function mintFromImagePayment(
        address to,
        string memory metadataURI,
        uint256 imagePaymentId
    ) public payable nonReentrant whenNotPaused returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(msg.value >= mintFee, "Insufficient CELO sent");
        require(imagePaymentId > 0, "Invalid image payment ID");

        // Transfer native CELO to treasury
        (bool sent, ) = treasuryAddress.call{value: msg.value}("");
        require(sent, "Failed to send CELO to treasury");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Mark as ImageToNFT and associate with payment
        tokenMintSource[tokenId] = MintSource.ImageToNFT;
        tokenImagePaymentId[tokenId] = imagePaymentId;

        emit NFTMinted(to, tokenId, metadataURI, MintSource.ImageToNFT, imagePaymentId);

        return tokenId;
    }

    /**
     * @dev V2: Get NFT details including source
     * @param tokenId Token ID
     * @return owner Token owner
     * @return uri Token URI
     * @return source Mint source (LegacyMint, DirectMint, or ImageToNFT)
     * @return imagePaymentId Associated image payment ID (0 if not applicable)
     */
    function getTokenDetails(uint256 tokenId) external view returns (
        address owner,
        string memory uri,
        MintSource source,
        uint256 imagePaymentId
    ) {
        require(_exists(tokenId), "Token does not exist");
        return (
            ownerOf(tokenId),
            tokenURI(tokenId),
            tokenMintSource[tokenId],
            tokenImagePaymentId[tokenId]
        );
    }

    /**
     * @dev V2: Get all tokens by mint source for an owner
     * @param owner Token owner
     * @param source Filter by mint source
     * @return Array of token IDs matching the criteria
     */
    function getTokensBySource(address owner, MintSource source) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tempTokenIds = new uint256[](balance);
        uint256 count = 0;

        // Iterate through all tokens (note: this is gas-intensive for large collections)
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_exists(i) && ownerOf(i) == owner && tokenMintSource[i] == source) {
                tempTokenIds[count] = i;
                count++;
            }
        }

        // Create properly sized array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempTokenIds[i];
        }

        return result;
    }

    // Owner functions
    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
        emit MintFeeUpdated(newFee);
    }

    function setTreasuryAddress(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = newTreasury;
        emit TreasuryAddressUpdated(newTreasury);
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

    // View functions
    function nextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    // Required overrides
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // The following functions are overrides required by Solidity
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }

    /**
     * @dev Check if token exists (internal helper)
     */
    function _exists(uint256 tokenId) internal view override returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}
