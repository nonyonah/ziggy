// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZiggyToken ($ZIGGY)
 * @notice Fair-launch ERC20 token with small tx fee to Ziggy treasury
 * @dev Deployed by Ziggy agent when treasury growth milestone is reached
 */
contract ZiggyToken is ERC20, Ownable {
    // Treasury address (receives tx fees)
    address public treasury;
    
    // Fee configuration (basis points, 100 = 1%)
    uint256 public buyFee = 100;  // 1%
    uint256 public sellFee = 200; // 2%
    uint256 public constant MAX_FEE = 500; // 5% max
    
    // Fee exemptions
    mapping(address => bool) public isExemptFromFee;
    
    // DEX pairs (for detecting sells)
    mapping(address => bool) public isDexPair;
    
    // Events
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeesUpdated(uint256 buyFee, uint256 sellFee);
    event DexPairSet(address indexed pair, bool isPair);
    
    constructor(
        string memory name_,
        string memory symbol_,
        address treasury_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        require(treasury_ != address(0), "Invalid treasury");
        
        treasury = treasury_;
        
        // Mint initial supply to deployer (fair launch distribution)
        _mint(msg.sender, initialSupply_);
        
        // Exempt treasury and deployer from fees
        isExemptFromFee[treasury_] = true;
        isExemptFromFee[msg.sender] = true;
    }
    
    // ============================================================
    // Transfer with Fee
    // ============================================================
    
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        // Skip fee logic for mints/burns or exempt addresses
        if (from == address(0) || to == address(0) || 
            isExemptFromFee[from] || isExemptFromFee[to]) {
            super._update(from, to, value);
            return;
        }
        
        uint256 feeAmount = 0;
        
        // Determine if buy or sell
        if (isDexPair[from]) {
            // Buying from DEX
            feeAmount = (value * buyFee) / 10000;
        } else if (isDexPair[to]) {
            // Selling to DEX
            feeAmount = (value * sellFee) / 10000;
        }
        
        if (feeAmount > 0) {
            // Send fee to treasury
            super._update(from, treasury, feeAmount);
            // Send remainder to recipient
            super._update(from, to, value - feeAmount);
        } else {
            // Regular transfer (no fee)
            super._update(from, to, value);
        }
    }
    
    // ============================================================
    // Admin Functions
    // ============================================================
    
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        isExemptFromFee[newTreasury] = true;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    function setFees(uint256 newBuyFee, uint256 newSellFee) external onlyOwner {
        require(newBuyFee <= MAX_FEE && newSellFee <= MAX_FEE, "Fee too high");
        buyFee = newBuyFee;
        sellFee = newSellFee;
        emit FeesUpdated(newBuyFee, newSellFee);
    }
    
    function setDexPair(address pair, bool isPair) external onlyOwner {
        isDexPair[pair] = isPair;
        emit DexPairSet(pair, isPair);
    }
    
    function setFeeExempt(address account, bool exempt) external onlyOwner {
        isExemptFromFee[account] = exempt;
    }
    
    // ============================================================
    // View Functions
    // ============================================================
    
    function calculateFee(address from, address to, uint256 amount) 
        external view returns (uint256 feeAmount, uint256 netAmount) 
    {
        if (isExemptFromFee[from] || isExemptFromFee[to]) {
            return (0, amount);
        }
        
        if (isDexPair[from]) {
            feeAmount = (amount * buyFee) / 10000;
        } else if (isDexPair[to]) {
            feeAmount = (amount * sellFee) / 10000;
        }
        
        netAmount = amount - feeAmount;
    }
}
