pragma solidity ^0.5.6;

import "../interfaces/IUniswapV2Callee.sol";
import "../libraries/UniswapV2Library.sol";
import "../interfaces/V1/IUniswapV1Factory.sol";
import "../interfaces/V1/IUniswapV1Exchange.sol";
import "../interfaces/IUniswapV2Router01.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IWETH.sol";

contract ExampleFlashSwap is IUniswapV2Callee {
    IUniswapV1Factory factoryV1;
    address factory;
    IWETH WETH;

    constructor(
        address _factory,
        address _factoryV1,
        address router
    ) public {
        factoryV1 = IUniswapV1Factory(_factoryV1);
        factory = _factory;
        WETH = IWETH(IUniswapV2Router01(router).WETH());
    }

    //需要从任何V1交易所和WETH接受ETH。理想情况下，可以像在路由器中那样强制执行
    //但这是不可能的，因为它需要调用v1工厂，这会消耗大量的gas
    function() external payable {}

    //通过V2闪存交换获取令牌/WETH，交换V1上的ETH /令牌，偿还V2并保留其余部分！
    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external {
        address[] memory path = new address[](2);
        uint256 amountToken;
        uint256 amountETH;
        {
            //令牌{0,1}的范围，避免了堆栈太深的错误
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            //确保msg.sender实际上是V2对
            assert(
                msg.sender == UniswapV2Library.pairFor(factory, token0, token1)
            );
            //此策略是单向的
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            path[0] = amount0 == 0 ? token0 : token1;
            path[1] = amount0 == 0 ? token1 : token0;
            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountETH = token0 == address(WETH) ? amount0 : amount1;
        }
        //此策略仅适用于V2 WETH对
        assert(path[0] == address(WETH) || path[1] == address(WETH)); // this strategy only works with a V2 WETH pair
        IERC20 token = IERC20(path[0] == address(WETH) ? path[1] : path[0]);
        //获得V1交换
        IUniswapV1Exchange exchangeV1 = IUniswapV1Exchange(
            factoryV1.getExchange(address(token))
        ); // get V1 exchange

        if (amountToken > 0) {
            //V1的滑动参数，由调用者传递
            uint256 minETH = abi.decode(data, (uint256)); // slippage parameter for V1, passed in by caller
            token.approve(address(exchangeV1), amountToken);
            uint256 amountReceived = exchangeV1.tokenToEthSwapInput(
                amountToken,
                minETH,
                uint256(-1)
            );
            uint256 amountRequired = UniswapV2Library.getAmountsIn(
                factory,
                amountToken,
                path
            )[0];
            //如果我们没有获得足够的ETH来偿还我们的快速贷款，则会失败
            assert(amountReceived > amountRequired); // fail if we didn't get enough ETH back to repay our flash loan
            WETH.deposit.value(amountRequired)();
            //将WETH返回到V2对
            assert(WETH.transfer(msg.sender, amountRequired)); // return WETH to V2 pair
            // solium-disable-next-line
            (bool success, ) = sender.call.value(
                //保持其余！
                amountReceived - amountRequired
            )(new bytes(0)); // keep the rest! (ETH)
            assert(success);
        } else {
            //V1的滑动参数，由调用者传递
            uint256 minTokens = abi.decode(data, (uint256)); // slippage parameter for V1, passed in by caller
            WETH.withdraw(amountETH);
            uint256 amountReceived = exchangeV1.ethToTokenSwapInput.value(
                amountETH
            )(minTokens, uint256(-1));
            uint256 amountRequired = UniswapV2Library.getAmountsIn(
                factory,
                amountETH,
                path
            )[0];
            //如果我们没有获得足够的代币来偿还我们的紧急贷款，则会失败
            assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan
            //将令牌返还给V2对
            assert(token.transfer(msg.sender, amountRequired)); // return tokens to V2 pair
            //保持其余！
            assert(token.transfer(sender, amountReceived - amountRequired)); // keep the rest! (tokens)
        }
    }
}
