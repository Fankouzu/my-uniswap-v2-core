const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const UniswapV2Router01 = artifacts.require("UniswapV2Router01");

const feeToSetter = '0xa5F1e2596DC1e878a6a039f41330d9A97c771bE9';
const WETH = '0xa5F1e2596DC1e878a6a039f41330d9A97c771bE9';
//0xE91226e2aC54234cae69cafF407fdfc84fc6B1BC
module.exports = (deployer, network, accounts) => {
    console.log('network',network)
    // deployer.deploy(UniswapV2Factory, feeToSetter).then((FactoryInstance)=>{
    //     return deployer.deploy(UniswapV2Router01,FactoryInstance.address,)
    // });
};