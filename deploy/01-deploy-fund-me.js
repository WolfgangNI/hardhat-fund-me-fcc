// function deployFunc(hre) {
//     console.log("Test bestanden")
// }

// module.exports.default = deployFunc

// oben ist auch eine möglichkeit den code darzustellen, unten ist eine andere option

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
//     // das ist das gleiche wie hre.getNamedAccounts und hre.deployments
// }

const { networkConfig } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

// oben ist eine darstellung, über syntactic sugar kannn mans aber auch so schreiben:

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
        console.log("ethUsdPriceFeedAddress: " + ethUsdPriceFeedAddress)
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }

    log("-------------------------------------")
}
module.exports.tags = ["all", "fundme"]
