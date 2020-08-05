# unisawp配对合约
- 每一个交易对都有一个配对合约


|**方法名称**|**可视范围**|**类型**|**修饰符**|
|:-:|:-:|:-:|:-:|
| Constructor | Public ❗️ | 🛑  |NO❗️ |
| initialize | External ❗️ | 🛑  |NO❗️ |
| getReserves | Public ❗️ |   |NO❗️ |
| _safeTransfer | Private 🔐 | 🛑  | |
| _update | Private 🔐 | 🛑  | |
| _mintFee | Private 🔐 | 🛑  | |
| mint | External ❗️ | 🛑  | lock |
| burn | External ❗️ | 🛑  | lock |
| swap | External ❗️ | 🛑  | lock |
| skim | External ❗️ | 🛑  | lock |
| sync | External ❗️ | 🛑  | lock |
## 函数方法

### constructor 构造函数

1. 调用者赋值到工厂地址变量

### initialize 初始化方法
     * @param _token0 token0
     * @param _token1 token1
     * @dev 初始化方法,部署时由工厂调用一次

1. 确认调用者为工厂合约地址
2. 为token0,1赋值

### getReserves 获取储备
     * @return _reserve0 储备量0
     * @return _reserve1 储备量1
     * @return _blockTimestampLast 时间戳
     * @dev 获取储备

1. 返回储备量0,1和最后更新储备量的时间戳

### _safeTransfer 私有安全发送
     * @param token token地址
     * @param to    to地址
     * @param value 数额
     * @dev 私有安全发送

1. 调用token合约地址的低级transfer方法
2. 确认返回值为true并且返回的data长度为0或者解码后为true

### _update 更新储量
     * @param balance0 余额0
     * @param balance1  余额1
     * @param _reserve0 储备0
     * @param _reserve1 储备1
     * @dev 更新储量，并在每个区块的第一次调用时更新价格累加器

1. 确认`余额0`和`余额1`小于等于最大的uint112
2. 区块时间戳,将时间戳转换为uint32
3. 计算时间流逝
4. 如果时间流逝>0 并且 储备量0,1不等于0
5. 价格0最后累计 += 储备量1 * 2**112 / 储备量0 * 时间流逝
6. 价格1最后累计 += 储备量0 * 2**112 / 储备量1 * 时间流逝
7. 余额0,1放入储备量0,1
8. 更新最后时间戳
9. 触发同步事件

### _mintFee 如果收费，铸造流动性相当于1/6的增长sqrt（k）
     * @param _reserve0 储备0
     * @param _reserve1 储备1
     * @return feeOn
     * @dev 如果收费，铸造流动性相当于1/6的增长sqrt（k）

1. 查询工厂合约的feeTo变量值
2. 如果feeTo不等于0地址,feeOn等于true否则为false
3. 定义k值
4. 如果feeOn等于true
     - rootK = (储备量0*储备量1)的平方根
     - rootKLast = k值的平方根
     - 如果rootK>rootKLast
          - 分子 = erc20总量 * (rootK - rootKLast)
          - 分母 = rootK * 5 + rootKLast
          - 流动性 = 分子 / 分母
          - 如果流动性 > 0 将流动性铸造给feeTo地址
5. 否则如果_kLast不等于0
     - k值=0

### mint 铸造方法
     * @param to to地址
     * @return liquidity 流动性数量
     * @dev 铸造方法
     * @notice 应该从执行重要安全检查的合同中调用此低级功能

1. 获取`储备量0`,`储备量1`
2. 获取当前合约在token0,token1合约内的`余额0`,`余额1`
3. `数量0` = 余额0 - 储备量0;`数量1` = 余额1 - 储备量1
4. 调用铸造费方法,返回铸造费开关
5. 如果pair合约的`总量` 等于 0
    - 则
        1. 流动性 = (数量0 * 数量1)的平方根 - 最小流动性1000
        2. 在总量为0的初始状态,永久锁定最低流动性1000
    - 否则
        1. 流动性 = (数量0 * 总量 / 储备量0) 和 (数量1 * 总量 / 储备量1) 的最小值
6. 确认`流动性` 大于0
7. 铸造流动性给to地址
8. 更新储备量
9. 如果铸造费开关为true, k值 = 储备量0 * 储备量1

### burn 销毁方法
     * @param to to地址
     * @return amount0
     * @return amount1
     * @dev 销毁方法
     * @notice 应该从执行重要安全检查的合同中调用此低级功能

1. 获取`储备量0`,`储备量1`
2. 带入变量
3. `余额0,1` = 当前合约在`token0,1`合约内的余额
4. 流动性 = 当前合约的balanceOf映射中获取当前合约自身的流动性数量
5. 返回税费开关
6. 获取`总量`,必须在此处定义，因为`总量`可以在mintFee中更新
7. 数额0,1 = 流动性数量 * 余额0,1 / 总量, 使用余额确保按比例分配
8. 确认数额0,1大于0
9. 销毁当前合约内的流动性数量
10. 将数额0,1数量的token0,1发送给to地址
11. `余额0,1` = 当前合约在`token0,1`合约内的余额
12. 更新储备量(余额0,1,储备量0,1)
13. 如果铸造费开关为true, k值 = 储备0 * 储备1

### swap 交换方法
     * @param amount0Out 输出数额0
     * @param amount1Out 输出数额1
     * @param to    to地址
     * @param data  用于回调的数据
     * @dev 交换方法
     * @notice 应该从执行重要安全检查的合同中调用此低级功能

1. 确认`输出数量0,1`都大于0
2. 获取`储备量0`,`储备量1`
3. 确认`输出数量0,1` < `储备量0,1`
4. 初始化余额变量
5. 初始化`token0,1`变量
6. 确认to地址不等于`token0,1`
7. 如果`输出数量0,1` > 0 安全发送`输出数量0,1`的`token0,1`到to地址
8. 如果data的长度大于0 调用to地址的接口
9. `余额0,1` = 当前合约在`token0,1`合约内的余额
10. 如果 余额0 > 储备0 - 输出数量0 
     - 则 输入数量0 = 余额0 - (储备0 - 输出数量0) 
     - 否则 输入数量0 = 0
11. 如果 余额1 > 储备1 - 输出数量1 
     - 则 输入数量1 = 余额1 - (储备1 - 输出数量1) 
     - 否则 输入数量1 = 0
12. 确认`输入数量0||1`大于0
13. 调整后的余额0 = 余额0 * 1000 - (输入数量0 * 3)
14. 调整后的余额1 = 余额1 * 1000 - (输入数量1 * 3)
15. 确认`调整后的余额0` * `调整后的余额1` >= 储备0 * 储备1 * 1000000
16. 更新储备量(余额0,1,储备量0,1)
17. 触发交换事件

### skim 强制平衡以匹配储备
     * @param to to地址
     * @dev 强制平衡以匹配储备

1. 初始化`token0,1`变量
2. 将当前合约在`token0,1`的余额-`储备量0,1`安全发送到to地址

### sync 强制准备金与余额匹配
     * @dev 强制准备金与余额匹配

1. 更新储备量(当前合约在`token0,1`的`余额0,1`,`储备量0,1`)
