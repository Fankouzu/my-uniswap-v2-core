const utils = require('ethereumjs-util');
const bip39 = require('bip39');
const HDWallet = require('ethereum-hdwallet')
const Web3 = require('thinkium-web3js');
const Web3Js = require('web3');
const fs = require('fs');
const solc = require('solc');
const web3 = new Web3();
const assert = require('assert');
const web3Js = new Web3Js();

const rpxUrl = "http://rpctest.thinkium.org"
// const rpxUrl = "http://rpcproxy.thinkium.org"

const compile = (file) => {
    const { source, contractName } = require('../build/' + file + '.json')
    const input = {
        language: 'Solidity',
        sources: {
            'contracts.sol': {
                content: source
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts['contracts.sol'][contractName];
    const contractByteCode = contract.evm.bytecode.object.slice(0, 2) === '0x' ? contract.evm.bytecode.object : '0x' + contract.evm.bytecode.object;

    return contractByteCode;
}
const init = () => {
    return new Promise(async (resolve, reject) => {
        const mnemonic = fs.readFileSync(".secret").toString().trim();
        const seed = await bip39.mnemonicToSeed(mnemonic.trim())
        const hdwallet = HDWallet.fromSeed(seed)
        const privateKey = hdwallet.derive('m/44\'/60\'/0\'/0/0').getPrivateKey()
        const address = utils.privateToAddress(privateKey)
        console.log('from address: 0x' + address.toString('hex'))
        web3.setProvider(new web3.providers.HttpProvider(rpxUrl));
        web3.thk.defaultPrivateKey = privateKey
        web3.thk.defaultAddress = '0x' + address.toString('hex').toLowerCase()
        web3.thk.defaultChainId = "1"
        resolve(true)
    })
}
const deploy = (contractName, params) => {
    return new Promise(async (resolve, reject) => {
        init().then(() => {
            const { abi, bytecode } = require('../build/' + contractName + '.json')
            const contracts = web3.thk.contract(abi).new(...params, { data: bytecode });
            resolve(contracts)
        })
    })
}
const getTxHash = (transactionHash) => {
    return new Promise(async (resolve, reject) => {
        var i = 0;
        do {
            var conresp = web3.thk.GetTransactionByHash(web3.thk.defaultChainId, transactionHash);
            i++;
        } while (conresp.errCode == 4003 && i < 90)
        resolve(conresp)
    })
}
const callContract = (abi, contractAddress) => {
    return new Promise(async (resolve, reject) => {
        const contractObj = web3.thk.contract(abi, contractAddress).at(contractAddress);
        resolve(contractObj);
    })
}
const deployContract = (contract, param) => {
    return new Promise(async (resolve, reject) => {
        deploy(contract, param).then((contracts) => {
            console.log('transactionHash: ', contracts.transactionHash)
            getTxHash(contracts.transactionHash).then((Address) => {
                callContract(contracts.abi, Address).then((Instance) => {
                    resolve(Instance);
                })
            })
        })
    })
}
const call = (contract, Address) => {
    return new Promise(async (resolve, reject) => {
        init().then(() => {
            const { abi } = require('./build/contracts/' + contract + '.json')
            callContract(abi, Address).then((Instance) => {
                resolve(Instance);
            })
        })
    })
}
const setVal = (value) => {
    web3.thk.setVal(ether(value));
}
const ether = (amount) => {
    return web3.toWei(amount);
}
const toIban = (THAddress) => {
    return web3.Iban.toIban(THAddress).toString()
}
const isIban = (THAddress) => {
    return web3.Iban.isIban(THAddress)
}
const toAddress = (THAddress) => {
    return web3.Iban.toAddress(THAddress).toString()
}
const permit = (jsonInterface, parameters) => {
    return new Promise(async (resolve, reject) => {
        init().then(() => {
            const abiInput = web3Js.eth.abi.encodeFunctionCall(jsonInterface, parameters);
            const message = utils.keccak(utils.toBuffer(abiInput));
            const msgHash = utils.hashPersonalMessage(message);
            const sig = utils.ecsign(msgHash, web3.thk.defaultPrivateKey);
            resolve({ message: abiInput, v: sig.v, r: '0x' + sig.r.toString('hex'), s: '0x' + sig.s.toString('hex') })
        })
    })
}
const sign = (jsonInterface, parameters) => {
    return new Promise(async (resolve, reject) => {
        permit(jsonInterface, parameters).then((res) => {
            const signature = web3Js.eth.abi.encodeParameters(
                ['bytes32', 'bytes32', 'uint8'],
                [res.r, res.s, res.v]);
            resolve({ message: res.message, signature: signature.toString('hex') })
        })
    })
}
const generateAddress2 = (from, salt, initCode) => {
    var fromBuf = utils.toBuffer(from);
    var saltBuf = utils.toBuffer(
        utils.keccak(
            utils.toBuffer(
                web3Js.eth.abi.encodeParameter('uint256', salt)
            )
        )
    );
    var initCodeBuf = utils.toBuffer(initCode);
    return utils.toChecksumAddress('0x' + utils.generateAddress2(fromBuf, saltBuf, initCodeBuf).toString('hex'));
};
const signData = (input, privateKey) => {
    const message = utils.keccak(utils.toBuffer(input));
    const msgHash = utils.hashPersonalMessage(message);
    const sig = utils.ecsign(msgHash, utils.toBuffer(privateKey));
    return web3Js.eth.abi.encodeParameters(
        ['bytes32', 'bytes32', 'uint8'],
        [sig.r, sig.s, sig.v]);
}
const recoverData = (input, v, r, s) => {
    const message = utils.keccak(utils.toBuffer(input));
    const msgHash = utils.hashPersonalMessage(message);
    const public = utils.ecrecover(
        msgHash,
        v,
        utils.toBuffer(r),
        utils.toBuffer(s)
    );
    return {'public':'0x04'+public.toString('hex'),'address':'0x'+utils.publicToAddress(public).toString('hex')};
}

module.exports = {
    init,
    compile,
    deploy,
    getTxHash,
    callContract,
    deployContract,
    ether,
    setVal,
    call,
    toIban,
    isIban,
    toAddress,
    permit,
    sign,
    generateAddress2,
    signData,
    recoverData
};