pragma solidity ^0.5.6;

import '../UniswapV2ERC20.sol';

contract ERC20 is UniswapV2ERC20 {
    //token名称
    string public constant name = "Swap Test Coin";
    //token缩写
    string public constant symbol = "STC";

    constructor(address owner) public {
        _mint(owner, 1000000000 * 10**18);
    }
}
