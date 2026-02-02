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
