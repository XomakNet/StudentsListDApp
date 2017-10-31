pragma solidity ^0.4.15;

contract StudentsRegistry {

    mapping(address => bytes32) public names;
    address public tokenAddress;

    event StudentRegistered(bytes32 name, address addr);

    function StudentsRegistry(address _tokenAddress) public {
        tokenAddress = _tokenAddress;
    }

    function registerStudent(bytes32 name) public {
        require(names[msg.sender] == 0);
        names[msg.sender] = name;
        StudentRegistered(name, msg.sender);
    }
}