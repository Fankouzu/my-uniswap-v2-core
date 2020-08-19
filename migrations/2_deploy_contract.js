const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const UniswapV2Router01 = artifacts.require("UniswapV2Router01");

const feeToSetter = '0xa5F1e2596DC1e878a6a039f41330d9A97c771bE9';
const WETH = {
    mainnet:'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    ropsten:'0xc778417E063141139Fce010982780140Aa0cD5Ab',
    rinkeby:'0xc778417E063141139Fce010982780140Aa0cD5Ab',
    goerli:'0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    kovan:'0xd0A1E359811322d97991E03f863a0C30C2cF029C'
};
//0xE91226e2aC54234cae69cafF407fdfc84fc6B1BC
module.exports = (deployer, network, accounts) => {
    deployer.deploy(UniswapV2Factory, feeToSetter).then((FactoryInstance)=>{
        return deployer.deploy(UniswapV2Router01,FactoryInstance.address,WETH[network]);
    });
};

//factory : 0xbEf9264ba9b33dFDDE34b9D2E97C2BC0855E9D1B
//router  : 0xEd2F0cD14b8627701A18E2184468B014Dd9f8133