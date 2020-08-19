const ERC20 = artifacts.require("ERC20");

const owner = '0xa5F1e2596DC1e878a6a039f41330d9A97c771bE9';
module.exports = (deployer, network, accounts) => {
    deployer.deploy(ERC20,owner);
};
