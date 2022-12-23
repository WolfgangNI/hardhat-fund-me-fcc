const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip // das fragezeichen ist wie eine if bedingung, wenn unser verwendetes network ein development network ist, wird der describe block übersprungen. wenn nicht dann gehts weiter.
    : describe("fundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1") // "1000000000000000000" // 1 ETH
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer // { depolyer } in {} bedeuted abstract just the deployer from getNamedAccounts
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
