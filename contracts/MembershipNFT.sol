// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MembershipNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    struct Player {
        string name;
        uint8 age;
        string position;
        uint8 height;
        uint8 weight;
        string image;
    }

    mapping(uint256 => Player) public playerProfiles;
    mapping(address => bool) public hasMinted;

    constructor(address initialOwner) ERC721("MembershipNFT", "MNFT") Ownable(initialOwner) {}

    function mint(
        string memory name,
        uint8 age,
        string memory position,
        uint8 height,
        uint8 weight,
        string memory image,
        string memory metadataURI
    ) external {
        require(!hasMinted[msg.sender], "NFT already claimed");

        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        playerProfiles[tokenId] = Player(name, age, position, height, weight, image);
        hasMinted[msg.sender] = true;
        nextTokenId++;
    }
}
