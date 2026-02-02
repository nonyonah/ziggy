// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ZiggyJournal {
    event Log(string indexed action, address indexed target, string reason, uint256 timestamp);

    function log(string memory action, address target, string memory reason) public {
        emit Log(action, target, reason, block.timestamp);
    }
}
