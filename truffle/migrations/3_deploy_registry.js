// This is a workaround for bug https://github.com/trufflesuite/truffle/issues/630
var HumanStandardToken = artifacts.require("HumanStandardToken.sol");
var StudentsRegistry = artifacts.require("StudentsRegistry.sol");

module.exports = function (deployer) {
    deployer.deploy(StudentsRegistry, HumanStandardToken.address);
};
