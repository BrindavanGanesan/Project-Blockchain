// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Payments {
    address public owner;

    event PaymentReceived(address indexed sender, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function withdraw(address payable _to, uint256 _amount) public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(address(this).balance >= _amount, "Insufficient balance");
        _to.transfer(_amount);
        emit Withdrawal(_to, _amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
