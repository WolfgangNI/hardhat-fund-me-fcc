// SPDX-License-Identifier: MIT
// Style Guide: Pragma
pragma solidity ^0.8.8;

// Style Guide: impoorts
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

// Style Guide: Error Codes // Contract Name vor __ mit dazu schreiben damit man g,eich weis woher der Fehler kommt
error FundMe__NotOwner();

// Style Guide: Interfaces, Libraries die nicht bereits importiert wurden kommen hierhin, aber gibts keine

// Style Guide: Contracts

//NatSpec Doxygen kommentar zeug:
/// @title A contract for crowd funding
/**
 * @author Wolfgang NFTIdeation
 * @notice This contract is to demo a sample funding contract
 * @dev This implements pricefeeds as or library
 */
contract FundMe {
    // Style Guide: Type Declarations
    using PriceConverter for uint256;

    // Style Guide: State Variables Declarations
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

    AggregatorV3Interface public s_priceFeed;

    // Style Guide: Events (none)

    // Style Guide: Modifiers
    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // Style Guide: Functions

    // Style Guide: constructor
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // Style Guide: Receive
    // receive() external payable {
    //     fund();
    // }

    // Style Guide: Fallback
    // fallback() external payable {
    //     fund();
    // }

    //Style Guide: External (none)

    //Style Guide: public

    /**
     * @notice This function funds this contract
     * @dev developer comment
     */
    function fund() public payable {
        require( // using revert instead of require saves gas aswell since the string wouldnt be safed on the Blockchain
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        console.log("withdraw function triggered");
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        console.log("cheaperWithdraw function triggered");
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0; //mappings cant't be in memory
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    //Style Guide: internal
    //Style Guide: private
    //Style Guide: view/pure

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
