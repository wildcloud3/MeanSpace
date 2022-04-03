---
title: Java 并发
author: Li Zhuliang
date: 2020-03-12 06:14:36
---

## 线程池
* Runnable在 Java8 之后，用闭包，方便了好多
* Executors 有几个不错的静态方法可以方便创建线程池
    * newWorkStealingPool 用并发度描述要创建的池，而不用指定具体线程数
    * 阿里手册不建议用这几个静态方法的原因是，里面多是无界 Queue，可能导致 OOM
    * gracefully shutdown:
        1. 先 shutdown
        2. 再 awaitTermination
        3. 再判断是否 terminated
        4. 再 shutdownNow

## Lock
* synchronized
    * 方便
    * 存储在 Object 的 Markword 里面，每个 Object 都有
    * JDK6 之后已经优化，有升级过程，如下
        * 偏向锁
            * 当线程执行到临界区（critical section）时，此时会利用CAS(Compare and Swap)操作，将线程ID插入到Markword中，同时修改偏向锁的标志位
            * 偏向锁是jdk1.6引入的一项锁优化
            * 这个锁会偏向于第一个获得它的线程，在接下来的执行过程中，假如该锁没有被其他线程所获取，没有其他线程来竞争该锁，那么持有偏向锁的线程将永远不需要进行同步操作
                * 如果同线程、同锁，不再需要去进行加锁或者解锁操作
                * 如果有变，则*锁膨胀*，先升级成轻量锁
        * 轻量锁
            * 会将 Markword 替换为轻量锁对象的指针
            * 自旋锁
                * 所谓自旋，就是指当有另外一个线程来竞争锁时，这个线程会在原地循环等待，而不是把该线程给阻塞，直到那个获得锁的线程释放锁之后，这个线程就可以马上获得锁的
                * 自旋10 次（默认）后，升级为重量级锁
            * 自适应自旋锁
                * 动态改变自旋次数
        * 重量级锁，互斥锁
            * 重量级锁是依赖对象内部的monitor锁来实现的，JDK1.6 之前的实现
            * markword 会指向 mutex 指针（互斥）
            * 会把等待想要获得锁的线程进行阻塞，被阻塞的线程不会消耗cup
             * 但是阻塞或者唤醒一个线程时，都需要操作系统来帮忙，需要从用户态转换到内核态（代价很高）
        * jdk1.6之后，该关键字被进行了很多的优化，已经不像以前那样不给力了，建议大家多使用
    * 和线程的 interrupt 有点冲突，可能导致死锁
* ReenterantLock
    * 最常用
    * 公平锁：指多个线程获取锁被阻塞的情况下，锁变为可用时，最新申请锁的线程获得锁
    * 非公平锁：非公平锁是指多个线程等待锁的情况下，锁变为可用状态时，哪个线程获得锁是随机的
    * ReentrantReadWriteLock
        * 分读写
* StampedLock
    * 需要自己判断 stamp
    * 可以做乐观锁
* Semaphore
    * 可以控制多个进入

## Atomic && Concurrent
### AtomicInteger
* 简单方便
* `unsafe.compareAndSet` 的 CAS
    * CAS 是另外一大块，硬件级指令
* 还有 Boolean、Long、Referrence
* 如果是 Ref 还有 ABA 的问题，+1再-1结果看到一样，有了 AtomicStamp edReferrence
### LongAdder （LongAccumulator）
*  两者实现类似，Adder 是简化的`x+y`，Accumulator 的二元操作，可以自己指定
* 底下实现了`Striped64`，里面有个 Cell 内部类，是核心，用了 `Cell[]` 来减少冲突，最后取值时再 sum
    * 最后 sum 不保证安全
### ConcurrentMap
* ConcurrentMap 是接口，不同于 ConcurrentHashMap
    * ConcurrentHashMap 扩展了接口的几个实现：forEach, search, searchValues, reduce
    * 此类接口调用时，可以指定并发度，底下用了`ForkJoinPool`
    * 而接口 ConcurrentMap 的实现上是没有并发的
* 分段锁
    * JDK7 开始使用，一个 ConcurrentHashMap 有多个 Segment
    * Segment继承自ReentrantLock
    * 对于 put, get 等方法涉及单Segment 没问题，size 方法另外维护了 modCount 以提高效率
* Java8 放弃分段锁，使用 CAS 及链表过长（8）时扩展为红黑树
    * 另外维护了一个 volatile 的 CounterCell 来计算 size
