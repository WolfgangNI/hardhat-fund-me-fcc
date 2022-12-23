// unit testing ist wie modultest, und wird local mit der hardhat blockchain getestet
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) //Ausrufezeichen bedeutet not.
    ? describe.skip // das fragezeichen ist wie eine if bedingung, wenn unser verwendetes network ein development network ist, wird der describe block übersprungen. wenn nicht dann gehts weiter.
    : describe("fundMe", async function () {
          let fundMe
          let deployer
          let MockV3Aggregator
          const sendValue = ethers.utils.parseEther("0.1") // "1000000000000000000" // 1 ETH
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer // { depolyer } in {} bedeuted abstract just the deployer from getNamedAccounts
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              MockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, MockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updates the amount-funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              it("withdraw ETH from a single founder", async function () {
                  await fundMe.fund({ value: sendValue })
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // Wie viel ETH ist im Contract
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // Wie viel ETH hat der Deployer
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // .mul ist bignumber multiply
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //BigNumber.add da die nummer von der blockchain kommt und sehr groß sein wird mit der bigNumber von ethers JS function arbeiten
                      endingDeployerBalance.add(gasCost).toString() // toString ist notwendig zum vergleichen der beiden werte
                  )
              })
              it("allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < accounts.length; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // How much ETH is in the Contract
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // How much ETH has the Deployer

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // .mul means bignumber multiply
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  console.log("startingFundMeBalance" + startingFundMeBalance)
                  console.log(
                      "startingDeployerBalance" + startingDeployerBalance
                  )
                  console.log("endingFundMeBalance" + endingFundMeBalance)
                  console.log("endingDeployerBalance" + endingDeployerBalance)
                  console.log("gasCost" + gasCost)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted
                  // mapping abprüfen
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  //console.log("accounts: " + JSON.stringify(accounts))
                  const attacker = accounts[1]
                  //console.log("attacker: " + JSON.stringify(attacker))
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  //console.log("attackerConnectedContract: " + JSON.stringify(attackerConnectedContract) )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw: withdraw ETH from a single founder", async function () {
                  await fundMe.fund({ value: sendValue })
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // Wie viel ETH ist im Contract
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // Wie viel ETH hat der Deployer
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // .mul ist bignumber multiply
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //BigNumber.add da die nummer von der blockchain kommt und sehr groß sein wird mit der bigNumber von ethers JS function arbeiten
                      endingDeployerBalance.add(gasCost).toString() // toString ist notwendig zum vergleichen der beiden werte
                  )
              })

              it("cheaperWithdraw: allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < accounts.length; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // How much ETH is in the Contract
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // How much ETH has the Deployer

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // .mul means bignumber multiply
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  console.log("startingFundMeBalance" + startingFundMeBalance)
                  console.log(
                      "startingDeployerBalance" + startingDeployerBalance
                  )
                  console.log("endingFundMeBalance" + endingFundMeBalance)
                  console.log("endingDeployerBalance" + endingDeployerBalance)
                  console.log("gasCost" + gasCost)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  // Make sure that the getFunders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted
                  // mapping abprüfen
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("cheaperWithdraw: Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  //console.log("accounts: " + JSON.stringify(accounts))
                  const attacker = accounts[1]
                  //console.log("attacker: " + JSON.stringify(attacker))
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  //console.log("attackerConnectedContract: " + JSON.stringify(attackerConnectedContract) )
                  await expect(
                      attackerConnectedContract.cheaperWithdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
