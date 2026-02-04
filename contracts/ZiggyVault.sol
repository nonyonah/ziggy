// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ZiggyVault
 * @notice ERC4626 vault that wraps Ziggy's yield strategy
 * @dev Community can deposit USDC and earn yield from Ziggy's farming
 */
contract ZiggyVault is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Ziggy treasury (receives performance fee)
    address public treasury;
    
    // Performance fee (basis points, 1000 = 10%)
    uint256 public performanceFee = 1000; // 10%
    uint256 public constant MAX_FEE = 2000; // 20% max
    
    // Deposit cap (0 = unlimited)
    uint256 public depositCap;
    
    // Strategy address (where funds are deployed)
    address public strategy;
    
    // Tracking
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public lastHarvestTime;
    uint256 public totalPerformanceFeesCollected;
    
    // Events
    event Harvested(uint256 profit, uint256 fee, uint256 timestamp);
    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
    event DepositCapUpdated(uint256 newCap);
    
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address treasury_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable(msg.sender) {
        require(treasury_ != address(0), "Invalid treasury");
        treasury = treasury_;
    }
    
    // ============================================================
    // ERC4626 Overrides
    // ============================================================
    
    function totalAssets() public view override returns (uint256) {
        // Assets in vault + assets in strategy
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        uint256 strategyBalance = strategy != address(0) 
            ? IERC20(asset()).balanceOf(strategy) 
            : 0;
        return vaultBalance + strategyBalance;
    }
    
    function maxDeposit(address) public view override returns (uint256) {
        if (depositCap == 0) return type(uint256).max;
        uint256 currentAssets = totalAssets();
        return currentAssets >= depositCap ? 0 : depositCap - currentAssets;
    }
    
    function deposit(uint256 assets, address receiver) 
        public override nonReentrant returns (uint256) 
    {
        require(assets <= maxDeposit(receiver), "Deposit exceeds cap");
        totalDeposited += assets;
        return super.deposit(assets, receiver);
    }
    
    function withdraw(uint256 assets, address receiver, address owner) 
        public override nonReentrant returns (uint256) 
    {
        totalWithdrawn += assets;
        return super.withdraw(assets, receiver, owner);
    }
    
    // ============================================================
    // Harvest (Collect and reinvest profits)
    // ============================================================
    
    function harvest() external onlyOwner {
        uint256 balanceBefore = totalAssets();
        
        // Pull profits from strategy (if any)
        if (strategy != address(0)) {
            // Strategy would implement a harvest function
            // This is a simplified placeholder
        }
        
        uint256 balanceAfter = totalAssets();
        
        if (balanceAfter > balanceBefore) {
            uint256 profit = balanceAfter - balanceBefore;
            uint256 fee = (profit * performanceFee) / 10000;
            
            if (fee > 0) {
                // Transfer fee to treasury
                IERC20(asset()).safeTransfer(treasury, fee);
                totalPerformanceFeesCollected += fee;
            }
            
            lastHarvestTime = block.timestamp;
            emit Harvested(profit, fee, block.timestamp);
        }
    }
    
    // ============================================================
    // Strategy Management
    // ============================================================
    
    function setStrategy(address newStrategy) external onlyOwner {
        address oldStrategy = strategy;
        strategy = newStrategy;
        emit StrategyUpdated(oldStrategy, newStrategy);
    }
    
    function deployToStrategy(uint256 amount) external onlyOwner {
        require(strategy != address(0), "No strategy set");
        IERC20(asset()).safeTransfer(strategy, amount);
    }
    
    function withdrawFromStrategy(uint256 amount) external onlyOwner {
        require(strategy != address(0), "No strategy set");
        // Strategy would need to implement a withdraw function
        // This requires strategy contract integration
    }
    
    // ============================================================
    // Admin Functions
    // ============================================================
    
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        treasury = newTreasury;
    }
    
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        performanceFee = newFee;
    }
    
    function setDepositCap(uint256 newCap) external onlyOwner {
        depositCap = newCap;
        emit DepositCapUpdated(newCap);
    }
    
    // ============================================================
    // View Functions
    // ============================================================
    
    function getVaultStats() external view returns (
        uint256 tvl,
        uint256 totalShares,
        uint256 sharePrice,
        uint256 deposited,
        uint256 withdrawn,
        uint256 fees
    ) {
        tvl = totalAssets();
        totalShares = totalSupply();
        sharePrice = totalShares > 0 ? (tvl * 1e18) / totalShares : 1e18;
        deposited = totalDeposited;
        withdrawn = totalWithdrawn;
        fees = totalPerformanceFeesCollected;
    }
    
    function getUserStats(address user) external view returns (
        uint256 shares,
        uint256 underlyingValue,
        uint256 depositValue
    ) {
        shares = balanceOf(user);
        underlyingValue = convertToAssets(shares);
        // Note: depositValue tracking would require additional bookkeeping
        depositValue = underlyingValue; // Simplified
    }
}
