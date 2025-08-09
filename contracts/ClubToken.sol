// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClubToken is ERC20, Ownable {
    uint256 public claimAmount = 1 * 10**18; // 1 token per claim
    uint256 public claimInterval = 30 days;    // claim cooldown
    mapping(address => uint256) public lastClaimed;

    mapping(address => bool) public verifiedWithWorldID;

    constructor() ERC20("ClubToken", "CLUB") Ownable(msg.sender) {}

    function claimTokens() external {
        require(block.timestamp >= lastClaimed[msg.sender] + claimInterval, "Claim not available yet");
        require(verifiedWithWorldID[msg.sender], "World ID verification required"); 
        lastClaimed[msg.sender] = block.timestamp;
        _mint(msg.sender, claimAmount);
    }

    function verifyWithWorldID(address user) external onlyOwner {
        verifiedWithWorldID[user] = true;
    }

    function updateClaimAmount(uint256 newAmount) external onlyOwner {
        claimAmount = newAmount;
    }

    function updateClaimInterval(uint256 newInterval) external onlyOwner {
        claimInterval = newInterval;
    }
}

