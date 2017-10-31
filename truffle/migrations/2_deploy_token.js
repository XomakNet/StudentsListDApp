var StandardHumanToken = artifacts.require("tokens/HumanStandardToken.sol");
var StudentsRegistry = artifacts.require("StudentsRegistry.sol");

module.exports = function (deployer) {
    deployer.deploy(StandardHumanToken, 5000, "Test tokens", 4, "TTK");
};
