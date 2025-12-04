-- Database Schema for Zodiac Card User Collections
-- Supports both Generated (image only) and Minted (NFT) items

-- User Collections Table
CREATE TABLE IF NOT EXISTS user_collections (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    collection_type VARCHAR(20) NOT NULL CHECK (collection_type IN ('Generated', 'Minted')),

    -- Image data (for both Generated and Minted)
    image_s3_key VARCHAR(255),
    image_url TEXT,

    -- Zodiac data
    zodiac_type VARCHAR(50) NOT NULL, -- Western, Chinese, Mayan, Vedic
    zodiac_sign VARCHAR(50) NOT NULL,
    birth_date DATE,
    fortune_text TEXT,

    -- Payment tracking
    image_payment_id BIGINT, -- From ZodiacImagePayment contract
    image_payment_tx_hash VARCHAR(66),
    image_payment_amount DECIMAL(20, 18) DEFAULT 2.0, -- 2 CELO
    image_payment_timestamp TIMESTAMP,

    -- NFT data (only for Minted)
    nft_token_id BIGINT,
    nft_mint_tx_hash VARCHAR(66),
    nft_mint_amount DECIMAL(20, 18) DEFAULT 3.0, -- 3 CELO
    nft_mint_timestamp TIMESTAMP,
    nft_metadata_uri TEXT,
    nft_mint_source VARCHAR(20) CHECK (nft_mint_source IN ('LegacyMint', 'DirectMint', 'ImageToNFT', NULL)),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    CONSTRAINT unique_image_payment UNIQUE (image_payment_id),
    CONSTRAINT unique_nft_token UNIQUE (nft_token_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_user_address ON user_collections(user_address);
CREATE INDEX idx_collection_type ON user_collections(collection_type);
CREATE INDEX idx_user_type ON user_collections(user_address, collection_type);
CREATE INDEX idx_image_payment_id ON user_collections(image_payment_id);
CREATE INDEX idx_nft_token_id ON user_collections(nft_token_id);
CREATE INDEX idx_created_at ON user_collections(created_at DESC);

-- Payment Verification Table (for tracking payment status)
CREATE TABLE IF NOT EXISTS payment_verifications (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('ImagePayment', 'NFTMint')),

    -- Transaction details
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number BIGINT,
    payment_amount DECIMAL(20, 18),

    -- Contract interaction
    contract_address VARCHAR(42) NOT NULL,
    payment_id BIGINT, -- Contract payment ID

    -- Verification status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_timestamp TIMESTAMP,

    -- Access control
    access_token VARCHAR(255), -- JWT token for image access
    access_token_expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_tx_hash ON payment_verifications(tx_hash);
CREATE INDEX idx_payment_user ON payment_verifications(user_address);
CREATE INDEX idx_payment_status ON payment_verifications(verification_status);
CREATE INDEX idx_access_token ON payment_verifications(access_token);

-- Statistics Table
CREATE TABLE IF NOT EXISTS user_statistics (
    user_address VARCHAR(42) PRIMARY KEY,

    -- Image generation stats
    total_images_generated INT DEFAULT 0,
    total_image_payments DECIMAL(20, 18) DEFAULT 0,

    -- NFT minting stats
    total_nfts_minted INT DEFAULT 0,
    total_nft_payments DECIMAL(20, 18) DEFAULT 0,

    -- Legacy stats (for backward compatibility)
    total_legacy_mints INT DEFAULT 0,
    total_legacy_payments DECIMAL(20, 18) DEFAULT 0,

    -- Engagement stats
    first_interaction_at TIMESTAMP,
    last_interaction_at TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- View for user's complete collection
CREATE OR REPLACE VIEW user_collection_view AS
SELECT
    uc.id,
    uc.user_address,
    uc.collection_type,
    uc.zodiac_type,
    uc.zodiac_sign,
    uc.birth_date,
    uc.fortune_text,
    uc.image_url,
    uc.image_payment_id,
    uc.image_payment_amount,
    uc.image_payment_timestamp,
    uc.nft_token_id,
    uc.nft_mint_amount,
    uc.nft_mint_timestamp,
    uc.nft_mint_source,
    uc.created_at,
    -- Total cost calculation
    CASE
        WHEN uc.collection_type = 'Generated' THEN uc.image_payment_amount
        WHEN uc.collection_type = 'Minted' AND uc.nft_mint_source = 'ImageToNFT' THEN uc.image_payment_amount + uc.nft_mint_amount
        WHEN uc.collection_type = 'Minted' AND uc.nft_mint_source = 'DirectMint' THEN uc.nft_mint_amount
        WHEN uc.collection_type = 'Minted' AND uc.nft_mint_source = 'LegacyMint' THEN 10.0
        ELSE 0
    END AS total_cost_celo
FROM user_collections uc;

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_collections_updated_at BEFORE UPDATE ON user_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_verifications_updated_at BEFORE UPDATE ON payment_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to add generated image to collection
CREATE OR REPLACE FUNCTION add_generated_image(
    p_user_address VARCHAR(42),
    p_zodiac_type VARCHAR(50),
    p_zodiac_sign VARCHAR(50),
    p_birth_date DATE,
    p_fortune_text TEXT,
    p_image_s3_key VARCHAR(255),
    p_image_url TEXT,
    p_payment_id BIGINT,
    p_payment_tx_hash VARCHAR(66),
    p_payment_amount DECIMAL(20, 18)
) RETURNS INT AS $$
DECLARE
    v_collection_id INT;
BEGIN
    INSERT INTO user_collections (
        user_address,
        collection_type,
        zodiac_type,
        zodiac_sign,
        birth_date,
        fortune_text,
        image_s3_key,
        image_url,
        image_payment_id,
        image_payment_tx_hash,
        image_payment_amount,
        image_payment_timestamp
    ) VALUES (
        p_user_address,
        'Generated',
        p_zodiac_type,
        p_zodiac_sign,
        p_birth_date,
        p_fortune_text,
        p_image_s3_key,
        p_image_url,
        p_payment_id,
        p_payment_tx_hash,
        p_payment_amount,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_collection_id;

    -- Update statistics
    INSERT INTO user_statistics (user_address, total_images_generated, total_image_payments, first_interaction_at, last_interaction_at)
    VALUES (p_user_address, 1, p_payment_amount, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_address) DO UPDATE SET
        total_images_generated = user_statistics.total_images_generated + 1,
        total_image_payments = user_statistics.total_image_payments + p_payment_amount,
        last_interaction_at = CURRENT_TIMESTAMP;

    RETURN v_collection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to convert generated image to minted NFT
CREATE OR REPLACE FUNCTION convert_to_minted_nft(
    p_collection_id INT,
    p_nft_token_id BIGINT,
    p_nft_mint_tx_hash VARCHAR(66),
    p_nft_mint_amount DECIMAL(20, 18),
    p_nft_metadata_uri TEXT,
    p_nft_mint_source VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_address VARCHAR(42);
BEGIN
    -- Update collection to Minted
    UPDATE user_collections
    SET
        collection_type = 'Minted',
        nft_token_id = p_nft_token_id,
        nft_mint_tx_hash = p_nft_mint_tx_hash,
        nft_mint_amount = p_nft_mint_amount,
        nft_mint_timestamp = CURRENT_TIMESTAMP,
        nft_metadata_uri = p_nft_metadata_uri,
        nft_mint_source = p_nft_mint_source
    WHERE id = p_collection_id
    RETURNING user_address INTO v_user_address;

    IF FOUND THEN
        -- Update statistics
        UPDATE user_statistics
        SET
            total_nfts_minted = total_nfts_minted + 1,
            total_nft_payments = total_nft_payments + p_nft_mint_amount,
            last_interaction_at = CURRENT_TIMESTAMP
        WHERE user_address = v_user_address;

        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Sample queries for testing

-- Get user's complete collection
-- SELECT * FROM user_collection_view WHERE user_address = '0x...' ORDER BY created_at DESC;

-- Get only generated images
-- SELECT * FROM user_collections WHERE user_address = '0x...' AND collection_type = 'Generated';

-- Get only minted NFTs
-- SELECT * FROM user_collections WHERE user_address = '0x...' AND collection_type = 'Minted';

-- Get user statistics
-- SELECT * FROM user_statistics WHERE user_address = '0x...';
