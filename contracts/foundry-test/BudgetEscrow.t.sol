// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BudgetEscrow.sol";
import "../src/MockUSDC.sol";

contract BudgetEscrowTest is Test {
    BudgetEscrow escrow;
    MockUSDC usdc;

    address operator = makeAddr("operator");
    address brand = makeAddr("brand");
    address soul = makeAddr("soul");

    bytes32 listingId = keccak256("listing_1");

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new BudgetEscrow(address(usdc), operator);

        usdc.mint(brand, 100_000e6);
        vm.prank(brand);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function test_deposit() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        assertEq(escrow.getBalance(listingId), 50e6);
        assertEq(escrow.getBrand(listingId), brand);
        assertEq(usdc.balanceOf(address(escrow)), 50e6);
    }

    function test_deposit_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit BudgetEscrow.Deposited(listingId, brand, 50e6);

        vm.prank(brand);
        escrow.deposit(listingId, 50e6);
    }

    function test_deposit_topUp() public {
        vm.startPrank(brand);
        escrow.deposit(listingId, 30e6);
        escrow.deposit(listingId, 20e6);
        vm.stopPrank();

        assertEq(escrow.getBalance(listingId), 50e6);
    }

    function test_deposit_revertZero() public {
        vm.prank(brand);
        vm.expectRevert(BudgetEscrow.ZeroAmount.selector);
        escrow.deposit(listingId, 0);
    }

    function test_deposit_revertWrongBrand() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        address other = makeAddr("other");
        usdc.mint(other, 100e6);
        vm.startPrank(other);
        usdc.approve(address(escrow), type(uint256).max);
        vm.expectRevert(BudgetEscrow.OnlyBrand.selector);
        escrow.deposit(listingId, 10e6);
        vm.stopPrank();
    }

    function test_claim() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        uint256 claimAmount = 1_500_000; // $1.50

        vm.prank(operator);
        escrow.claim(listingId, soul, claimAmount);

        // 10% fee = $0.15, yield = $1.35
        uint256 expectedFee = 150_000;
        uint256 expectedYield = 1_350_000;

        assertEq(usdc.balanceOf(soul), expectedYield);
        assertEq(usdc.balanceOf(operator), expectedFee);
        assertEq(escrow.getBalance(listingId), 50e6 - claimAmount);
    }

    function test_claim_emitsEvent() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        vm.expectEmit(true, true, false, true);
        emit BudgetEscrow.Claimed(listingId, soul, 1_350_000, 150_000);

        vm.prank(operator);
        escrow.claim(listingId, soul, 1_500_000);
    }

    function test_claim_revertNotOperator() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        vm.prank(brand);
        vm.expectRevert(BudgetEscrow.OnlyOperator.selector);
        escrow.claim(listingId, soul, 1e6);
    }

    function test_claim_revertInsufficientBalance() public {
        vm.prank(brand);
        escrow.deposit(listingId, 1e6);

        vm.prank(operator);
        vm.expectRevert(BudgetEscrow.InsufficientBalance.selector);
        escrow.claim(listingId, soul, 2e6);
    }

    function test_claim_revertZero() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        vm.prank(operator);
        vm.expectRevert(BudgetEscrow.ZeroAmount.selector);
        escrow.claim(listingId, soul, 0);
    }

    function test_claim_multipleClaims() public {
        vm.prank(brand);
        escrow.deposit(listingId, 10e6);

        vm.startPrank(operator);
        escrow.claim(listingId, soul, 1_500_000);
        escrow.claim(listingId, soul, 1_500_000);
        escrow.claim(listingId, soul, 1_500_000);
        vm.stopPrank();

        assertEq(usdc.balanceOf(soul), 1_350_000 * 3);
        assertEq(usdc.balanceOf(operator), 150_000 * 3);
        assertEq(escrow.getBalance(listingId), 10e6 - 4_500_000);
    }

    function test_refund() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        uint256 brandBalBefore = usdc.balanceOf(brand);

        vm.prank(brand);
        escrow.refund(listingId);

        assertEq(usdc.balanceOf(brand), brandBalBefore + 50e6);
        assertEq(escrow.getBalance(listingId), 0);
    }

    function test_refund_emitsEvent() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        vm.expectEmit(true, true, false, true);
        emit BudgetEscrow.Refunded(listingId, brand, 50e6);

        vm.prank(brand);
        escrow.refund(listingId);
    }

    function test_refund_revertNotBrand() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        vm.prank(soul);
        vm.expectRevert(BudgetEscrow.OnlyBrand.selector);
        escrow.refund(listingId);
    }

    function test_refund_revertZeroBalance() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        vm.prank(brand);
        escrow.refund(listingId);

        vm.prank(brand);
        vm.expectRevert(BudgetEscrow.ZeroAmount.selector);
        escrow.refund(listingId);
    }

    function test_refund_partialAfterClaims() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        vm.prank(operator);
        escrow.claim(listingId, soul, 10e6);

        vm.prank(brand);
        escrow.refund(listingId);

        assertEq(escrow.getBalance(listingId), 0);
        assertEq(usdc.balanceOf(brand), 100_000e6 - 10e6); // original mint minus claimed amount
    }

    function test_feeSplit_precision() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        // Test with $0.50 (minimum bid) — 500_000 units
        vm.prank(operator);
        escrow.claim(listingId, soul, 500_000);

        // 10% of 500_000 = 50_000 fee, 450_000 yield
        assertEq(usdc.balanceOf(soul), 450_000);
        assertEq(usdc.balanceOf(operator), 50_000);
    }

    function test_feeSplit_oneUnit() public {
        vm.prank(brand);
        escrow.deposit(listingId, 50e6);

        // Edge case: 1 unit (0.000001 USDC)
        vm.prank(operator);
        escrow.claim(listingId, soul, 1);

        // 10% of 1 = 0 (rounds down), yield = 1
        assertEq(usdc.balanceOf(soul), 1);
        assertEq(usdc.balanceOf(operator), 0);
    }

    function test_immutables() public view {
        assertEq(address(escrow.usdc()), address(usdc));
        assertEq(escrow.operator(), operator);
        assertEq(escrow.FEE_BPS(), 1000);
    }

    function test_multipleListings() public {
        bytes32 listing2 = keccak256("listing_2");

        vm.startPrank(brand);
        escrow.deposit(listingId, 30e6);
        escrow.deposit(listing2, 20e6);
        vm.stopPrank();

        assertEq(escrow.getBalance(listingId), 30e6);
        assertEq(escrow.getBalance(listing2), 20e6);

        vm.prank(operator);
        escrow.claim(listingId, soul, 1e6);

        assertEq(escrow.getBalance(listingId), 29e6);
        assertEq(escrow.getBalance(listing2), 20e6);
    }
}
