// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSystem {

    /* -------------------- STRUCTS -------------------- */

    struct Candidate {
        uint256 id;
        string name;
        string partySymbol;
        uint256 voteCount;
    }

    struct VoterProfile {
        string name;
        uint256 age;
        string location;
        bool isRegistered;
    }

    /* -------------------- STATE VARIABLES -------------------- */

    address public hec;
    bool public isActive;
    bool public resultsPublished;

    uint256 public candidateCount;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => VoterProfile) public voterProfiles;

    address[] private voters;

    /* -------------------- EVENTS -------------------- */

    event CandidateAdded(uint256 id, string name, string partySymbol);
    event VoterRegistered(address voter, string name);
    event VoteCast(address voter, uint256 candidateId);
    event VotingStarted();
    event VotingStopped();
    event ResultsPublished();

    /* -------------------- MODIFIERS -------------------- */

    modifier onlyHEC() {
        require(msg.sender == hec, "Only HEC can perform this action");
        _;
    }

    modifier whenActive() {
        require(isActive, "Voting is not active");
        _;
    }

    modifier whenNotActive() {
        require(!isActive, "Voting is currently active");
        _;
    }

    /* -------------------- CONSTRUCTOR -------------------- */

    constructor() {
        hec = msg.sender;
    }

    /* -------------------- VOTER FUNCTIONS -------------------- */

    function registerVoter(
        string memory _name,
        uint256 _age,
        string memory _location
    ) external {
        require(!voterProfiles[msg.sender].isRegistered, "Already registered");
        require(_age >= 18, "Must be at least 18 years old");

        voterProfiles[msg.sender] = VoterProfile(
            _name,
            _age,
            _location,
            true
        );

        emit VoterRegistered(msg.sender, _name);
    }

    function isRegisteredVoter(address _voter) external view returns (bool) {
        return voterProfiles[_voter].isRegistered;
    }

    /* -------------------- CANDIDATE FUNCTIONS -------------------- */

    function addCandidate(
        string memory _name,
        string memory _partySymbol
    )
        external
        onlyHEC
        whenNotActive
    {
        candidateCount++;

        candidates[candidateCount] = Candidate(
            candidateCount,
            _name,
            _partySymbol,
            0
        );

        emit CandidateAdded(candidateCount, _name, _partySymbol);
    }

    function getCandidate(uint256 _id)
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory partySymbol,
            uint256 voteCount
        )
    {
        require(_id > 0 && _id <= candidateCount, "Invalid candidate ID");
        Candidate memory c = candidates[_id];
        return (c.id, c.name, c.partySymbol, c.voteCount);
    }

    /* -------------------- VOTING CONTROL -------------------- */

    function startVoting() external onlyHEC whenNotActive {
        require(candidateCount >= 2, "At least 2 candidates required");

        isActive = true;
        resultsPublished = false;

        // Reset candidate votes
        for (uint256 i = 1; i <= candidateCount; i++) {
            candidates[i].voteCount = 0;
        }

        // Reset voter status
        for (uint256 i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }
        delete voters;

        emit VotingStarted();
    }

    function stopVoting() external onlyHEC whenActive {
        isActive = false;
        emit VotingStopped();
    }

    function publishResults() external onlyHEC {
        require(!isActive, "Voting still active");
        require(!resultsPublished, "Results already published");

        resultsPublished = true;
        emit ResultsPublished();
    }

    /* -------------------- VOTING -------------------- */

    function vote(uint256 _candidateId) external whenActive {
        require(voterProfiles[msg.sender].isRegistered, "Register before voting");
        require(!hasVoted[msg.sender], "Already voted");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        voters.push(msg.sender);

        emit VoteCast(msg.sender, _candidateId);
    }

    /* -------------------- HELPERS -------------------- */

    function getCandidateCount() external view returns (uint256) {
        return candidateCount;
    }

    function getIsActive() external view returns (bool) {
        return isActive;
    }

    function getResultsPublished() external view returns (bool) {
        return resultsPublished;
    }
}
