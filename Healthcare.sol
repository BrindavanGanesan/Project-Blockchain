// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Healthcare {
    struct Patient {
        string name;
        uint age;
        string medicalHistory;
    }

    mapping(address => Patient) public patients;
    address public owner;

    event PatientRegistered(address indexed patientAddress, string name);

    constructor() {
        owner = msg.sender;
    }

    function registerPatient(string memory _name, uint _age, string memory _medicalHistory) public {
        patients[msg.sender] = Patient(_name, _age, _medicalHistory);
        emit PatientRegistered(msg.sender, _name);
    }

    function getPatientDetails(address _patient) public view returns (string memory, uint, string memory) {
        require(msg.sender == _patient || msg.sender == owner, "Not authorized");
        Patient memory p = patients[_patient];
        return (p.name, p.age, p.medicalHistory);
    }
}
