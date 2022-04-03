---
title: JVM GC
author: Li Zhuliang
date: 2020-03-24 08:13:39
---
## 线程
### 生命周期
#### 操作系统：
5个状态，初始及终止比较容易理解，且不可逆，可运行<-->运行，运行-->休眠，休眠-->可运行

#### JVM 纯程
1. 合并可运行和运行状态
2. 扩展休眠为：BLOCKED、WAITING、TIME_WAITING

![jvm-os thread](https://cdn.jsdelivr.net/gh/wildcloud3/image_bed@master/2022/04/upgit_20220403_1648992139.png)

#### 状态转换方式：
1. NEW --> RUNNABLE: start
2. RUNNABLE --> TERMINATED: exit
3. RUNNABLE --> BLOCKED: synchronized（仅且唯一）
4. BLOCKED --> RUNNABLE: 获取监视器，monitorenter
5. RUNNABLE --> WAITING: wait, join, LockSupport.park
6. WAITING --> RUNNABLE: notify, notifyAll（相对效率较低，但安全）, LockSupport.unpart
7. RUNNABLE --> TIME_WAITING: 
	1. Thread.sleep
    2. Object.wait(long)
    3. Thread.join(long)
    4. LockSupport.park{time}
8. TIME_WAITING --> RUNNABLE: 同 WAITING
9. 实际上 Runnable 内部：
	1. READY TO RUN --> RUNNING: 系统调度
    2. RUNNING --> READY TO RUN: Thread.yield，但此方法及不可靠
    
#### 几个问题
1. catch 到 InterruptedException 之后，为什么要 currentThread.interrupt()?
> 在线程受到阻塞时抛出一个中断信号，这样线程就得以退出阻塞的状态。更确切的说，如果线程被Object.wait,Thread.join和Thread.sleep三种方法之一阻塞，那么，它将接收到一个中断异常（InterruptedException），从而提早地终结被阻塞状态

> 调用sleep、wait等此类可中断（throw InterruptedException）方法时，一旦方法抛出InterruptedException，当前调用该方法的线程的中断状态就会被jvm自动清除了，就是说我们调用该线程的isInterrupted 方法时是返回false。如果你想保持中断状态，可以再次调用interrupt方法设置中断状态。这样做的原因是，java的中断并不是真正的中断线程，而只设置标志位（中断位）来通知用户。如果你捕获到中断异常，说明当前线程已经被中断，不需要继续保持中断位。

2. Lock.lock()阻塞后，线程状态是什么？
> 视情况而定，可能有些中间瞬时态，主要是 WAITING，通过 AQS 底层 LockSupport.park进入 WAITING

3. synchronize 和 Lock 区别
> java 6 之前，有很大性能差别，之后相差不大；Lock 提供了更多更灵活的锁处理方式，如：不一定是代码块加锁，Condition 条件等

#### InterruptedException 的处理
1. 最应该用的，直接抛出，如果跟你业务无关
2. catch，清理现场，如果有些资源需要释放等，再继续抛出
3. （仅）在类似 Thread.run 中，继续调用`Thread.currentThread().interrupt()`来设置中断标识位，一方便你抛了也没用，另一方面这个接口是继承的

#### 几个名词
1. 饥饿：由于大量线程竞争，Condition 不满足，线程操作无法完成，而能够补上资源的线程无法得到机会运行
2. 忙等待：大量线程不断进入临界区，但由于 Condition 不满足，无法完成工作


## JVM 调优
其实就是调整内存相关参数，使减少、优化GC，使吞吐 or 延时达到最优
1. 直接`-Xms -Xmx`固定堆
2. 直接`-XX:NewSize && -XX:MaxNewSize`固定 eden 区，通常对于 web 型应用来说，吞吐量要求高于延时，此种情况下，一个较大的 eden区是合适的
	* 且 eden 区 ParNew 回收效率，主要取决于剩余对象数量，单纯放大 eden 区，通常不会对 YGC 有太大时间上的影响
3. 以上需要配合`-XX:-UseAdaptiveSizePolicy`
4. 使用`-verbose:gc -XX:+PrintGCDetails -XX:+PrintHeapAtGC -XX:+PrintTenuringDistribution`参数，打印合适的 GC 日志
5. 考虑收集更多 GC 相关指标

### 可达性分析
可作为 GC Roots 对象的四种：
1. 虚拟机栈（栈帧中的本地变量表）中的引用对象
2. 方法区中类静态属性引用对象
3. 方法区中常量引用对象
4. 本地方法栈中 JNI 引用对象

### GC 参数：
在常见的 ParNew+CMS 组合中（Hotspot），如果要使 `-XX:NewRatio`和`-XX:SurvivorRatio`之类的生效，需要先禁用`-XX:-UseAdaptiveSizePolicy`，不然是没有效果的

### 几种不同的收集器的使用：
1. G1，分 Region，但官方建议堆在 6G 以上使用

> Referrence:
> 1. [GC 动画](https://spin.atomicobject.com/2014/09/03/visualizing-garbage-collection-algorithms/)
