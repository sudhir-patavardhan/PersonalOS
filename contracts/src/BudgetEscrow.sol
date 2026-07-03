// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BudgetEscrow {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public immutable operator;
    uint256 public constant FEE_BPS = 1000; // 10%

    struct Listing {
        address brand;
        uint256 balance;
    }

    mapping(bytes32 => Listing) public listings;

    event Deposited(bytes32 indexed listingId, address indexed brand, uint256 amount);
    event Claimed(bytes32 indexed listingId, address indexed soul, uint256 yield, uint256 fee);
    event Refunded(bytes32 indexed listingId, address indexed brand, uint256 amount);

    error OnlyOperator();
    error OnlyBrand();
    error InsufficientBalance();
    error ZeroAmount();
    error ListingExists();

    modifier onlyOperator() {
        if (msg.sender != operator) revert OnlyOperator();
        _;
    }

    constructor(address _usdc, address _operator) {
        usdc = IERC20(_usdc);
        operator = _operator;
    }

    function deposit(bytes32 listingId, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        Listing storage l = listings[listingId];
        if (l.brand == address(0)) {
            l.brand = msg.sender;
        } else if (l.brand != msg.sender) {
            revert OnlyBrand();
        }
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        l.balance += amount;
        emit Deposited(listingId, msg.sender, amount);
    }

    function claim(bytes32 listingId, address soul, uint256 amount) external onlyOperator {
        if (amount == 0) revert ZeroAmount();
        Listing storage l = listings[listingId];
        if (l.balance < amount) revert InsufficientBalance();

        uint256 fee = (amount * FEE_BPS) / 10000;
        uint256 yield_ = amount - fee;

        l.balance -= amount;

        usdc.safeTransfer(soul, yield_);
        usdc.safeTransfer(operator, fee);

        emit Claimed(listingId, soul, yield_, fee);
    }

    function refund(bytes32 listingId) external {
        Listing storage l = listings[listingId];
        if (l.brand != msg.sender) revert OnlyBrand();
        uint256 amount = l.balance;
        if (amount == 0) revert ZeroAmount();

        l.balance = 0;
        usdc.safeTransfer(msg.sender, amount);

        emit Refunded(listingId, msg.sender, amount);
    }

    function getBalance(bytes32 listingId) external view returns (uint256) {
        return listings[listingId].balance;
    }

    function getBrand(bytes32 listingId) external view returns (address) {
        return listings[listingId].brand;
    }
}
