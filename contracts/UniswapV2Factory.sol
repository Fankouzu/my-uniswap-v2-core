pragma solidity =0.5.16;

import './interfaces/IUniswapV2Factory.sol';
import './UniswapV2Pair.sol';

//uniswap工厂
contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo; //收税地址
    address public feeToSetter; //收税权限控制地址
    //配对映射,地址=>(地址=>地址)
    mapping(address => mapping(address => address)) public getPair;
    //所有配对数组
    address[] public allPairs;
    //配对合约的Bytecode的hash
    bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(UniswapV2Pair).creationCode));
    //事件:配对被创建
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    /**
     * @dev 构造函数
     * @param _feeToSetter 收税开关权限控制
     */
    constructor(address _feeToSetter) public {
        feeToSetter = _feeToSetter;
    }

    /**
     * @dev 查询配对数组长度方法
     */
    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    /**
     *
     * @param tokenA TokenA
     * @param tokenB TokenB
     * @return pair 配对地址
     * @dev 创建配对
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        //确认tokenA不等于tokenB
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES');
        //将tokenA和tokenB进行大小排序,确保tokenA小于tokenB
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        //确认token0不等于0地址
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        //确认配对映射中不存在token0=>token1
        require(getPair[token0][token1] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        //给bytecode变量赋值"UniswapV2Pair"合约的创建字节码
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        //将token0和token1打包后创建哈希
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        //内联汇编
        //solium-disable-next-line
        assembly {
            //通过create2方法布署合约,并且加盐,返回地址到pair变量
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        //调用pair地址的合约中的"initialize"方法,传入变量token0,token1
        IUniswapV2Pair(pair).initialize(token0, token1);
        //配对映射中设置token0=>token1=pair
        getPair[token0][token1] = pair;
        //配对映射中设置token1=>token0=pair
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        //配对数组中推入pair地址
        allPairs.push(pair);
        //触发配对成功事件
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /**
     * @dev 设置收税地址
     * @param _feeTo 收税地址
     */
    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeTo = _feeTo;
    }

    /**
     * @dev 收税权限控制
     * @param _feeToSetter 收税权限控制
     */
    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}
