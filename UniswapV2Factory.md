# unisawp工厂合约
- 工厂合约负责布署配对合约

## 创建配对

### createPair 创建配对方法
     * @param tokenA TokenA
     * @param tokenB TokenB
     * @return pair 配对地址
     * @dev 创建配对

1. 确认tokenA不等于tokenB
2. 将tokenA和tokenB进行大小排序,确保token0小于token1
3. 确认token0不等于0地址
4. 确认配对映射中不存在token0=>token1
5. 字节码 = "UniswapV2Pair"合约的创建字节码
6. 盐值 = 将token0和token1打包后创建哈希
7. 通过create2方法布署合约,并且加盐,返回地址到pair变量
8. 调用pair地址的合约中的"initialize"方法,传入变量token0,token1
9. 配对映射中设置token0=>token1=pair
10. 配对映射中设置token1=>token0=pair
11. 配对数组中推入pair地址
12. 触发配对成功事件

## 设置收税

### setFeeTo 设置收税地址
     * @dev 设置收税地址
     * @param _feeTo 收税地址

1. 设置收税地址

### setFeeToSetter 收税权限控制
     * @dev 收税权限控制
     * @param _feeToSetter 收税权限控制

2. 设置收税权限控制