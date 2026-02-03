// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Poll {
    string public question;
    mapping(bool => uint256) public votes;

    constructor(string memory _question) {
        question = _question;
    }

    function vote(bool _option) public {
        votes[_option]++;
    }
}

contract Counter {
    uint256 public count;

    function increment() public {
        count++;
    }
}

contract Guestbook {
    string[] public messages;

    function sign(string memory _message) public {
        messages.push(_message);
    }
}

contract ExperimentalERC20 {
    string public name = "Ziggy Token";
    string public symbol = "ZIG";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        uint256 initialSupply = 1000000 * 10**decimals;
        balanceOf[msg.sender] = initialSupply;
        totalSupply = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
