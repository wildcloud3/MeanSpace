---
title: 锁事一二
author: Li Zhuliang
date: 2020-03-12 06:25:26
---

> 文章内容主要来源是一些公众号文章

## 一些分类方式
> 这部分的分类主要来源于一个关于面试问题的分类，so，确实很面试

### 乐观和悲观
乐观和悲观并不是一种锁的状态 or 行为，而是一个并发编程的 Pattern。早期是在 DB 上引入的说法，现在在 `java.util.concurrent` 包中也引入了。

DB 中常见的做法，对于悲观来说就是无脑上锁；对于乐观来说，随便读（除了值，再加个版本号），写时对比版本号，如果无变化，直接写入，如果变化了，失败重试。
	* 提一句，正好看了阿里最近的 Tair 的文章，里面关于 RCU无锁设计，其实也是个乐观锁
    * 再跟一句，是否乐观一定好？不一定，如果在冲突严重的情况，不断要退回重试，代价也不低

### 乐观锁
> 乐观锁正好和悲观锁相反，它获取数据的时候，并不担心数据被修改，每次获取数据的时候也不会加锁，只是在更新数据的时候，通过判断现有的数据是否和原数据一致来判断数据是否被其他线程操作，如果没被其他线程修改则进行数据更新，如果被其他线程修改则不进行数据更新。

### 悲观锁
> 悲观锁认为对于同一个数据的并发操作，一定是会发生修改的，哪怕没有修改，也会认为修改。因此对于同一个数据的并发操作，悲观锁采取加锁的形式。悲观地认为，不加锁的并发操作一定会出问题。

### 公平和非公平
1. 公不公平，对待的是三人互抢的情况
    * 如果公平，第三人和第二人一样，必须等待后才能 tryAcquire
    * 如果不公平，第三人可能早于先到的第一人 Acquire
2. 实现机制：在 wait(lock)前加一次 cas 自旋
3. 目的：如果资源很快就可以被使用完，这么做可以提高系统的吞吐率
	* 为什么能提高吞吐量：如果是非公平，在多个等待线程争抢时，不需要额外唤醒早进入等待的线程
4. 建议：如果操作资源的时间比上锁时间短，可以使用非公平锁提高吞率
	* 也可以使用自旋的方式来防止进入锁状态


### 独占和共享
这个一般出现在对读/写锁的讨论中，一般来说`ReadWriteLock`就是个典型的共享锁，允许共享读锁、独享写锁，即可以多个线程同时读，但只有一个线程写，且写锁一上，读也被阻止

实现上，用两把锁：`ReadLock && WriteLock` 来实现

### 可重入锁
可允许已经获得锁的线程，继续进入临界区的锁，一般的锁都是，如：`sychronize`和`ReenterLock`
* ReentrantLock implements Lock
* 构造参数 fair 来控制是否用非公平锁
* 实现的类中提供了一些 aux 函数，用于管理、查看，此锁相关的线程
* 公平锁的实现上，相比于非公平锁，多了一个检测前续排队中线程的check

### 自旋锁
其实并不是锁，使用空转来等待，而不交出线程，主要是为了提高性能，减少上下文切换，但是耗 CPU
> 一般使用 CAS 自旋

## 锁的来源（历史）
TODO: 

## 什么是 CAS
CAS，Compare and swap，是近代处理器提高的高级原子化操作，有点类似乐观锁的行为，泛泛地讲，通过`do while(cas)`来实现的功能，可以认为是无锁
* 如果目标原值和目标当前值相同，则更新为目标值
* 无锁的定义：没有上下文切换

### CAS 的问题
#### 自旋空耗
如果`while(cas)`总是失败，导致 CPU 长时间耗在自旋上

实际上这个情况，可以认为是选型错误，如果是经常要 cas 失败的，那就不适合用乐观锁机制。

#### ABA 问题
如果有三个 CAS 嵌套发生，并且外层 cas 时，目标值被一个阻塞线程读取初值，但又被第一次 cas和内部另一次cas更新到原值的值，会导致中间值更改的丢失

	如何解决: 引入版本号，200_V1 和 200_V3 不同，就不会 CAS 成功了
    
在 Java 中提供了`AtomicStampedReference`来实现这一机制
    
## 什么是 volatile
volatile 不是锁，但和并发关系很大，是 Java 提供的一种轻量级同步机制。一个被声明为 volatile 的变量，保证两种特性：
1. 此变量对所有线程可见，一旦被修改，其它线程都立即得知
	* 修改时，直接写入主内存
    * 其他线程读取时，加内存屏障，将变量从主存重新加载
    * 这一操作也是有性能代价的
2. 禁止指令重排

### 对比 synchronized
1. 在处理变量值的可见性上，两者的行为是等价的
2. volatile 是非阻塞的（弱同步），而 synchronized 是阻塞的
> 一个有趣的点：在标准的单例锁定双重检查方式中，对于 JDK1.5 之前的版本是不适用的，需要给整个 get 方法加锁，原因在于，对于引用类型，Java 无法保证其可见性；从 J2SE5，JSR133 后，可以用 volatile 来修饰变量，实现可见性

```
public class Singleton {  
    private volatile Singleton instance = null;  
    public Singleton getInstance() {  
        if (instance == null) {  
            synchronized(this) {  
                if (instance == null) {  
                    instance = new Singleton();  
                }  
            }  
        }  
        return instance;  
    }  
} 
```
当然现在更推荐的单例方式，Initialization on Demand Holder（IODH）：

```
public class Singleton {  
   
private Singleton () {};
 
    static class SingletonHolder {  
        static Singleton instance = new Singleton();  
    }  
      
    public static Singleton getInstance(){  
        return SingletonHolder.instance;  
    }  
}
```


## Java 中常见的锁实现
### synchronized
JDK内核级实现，原来被认为是重量级选手不建议使用，但在 JDK1.6 之后，进行了很多优化，包括：
1. 偏向：第一次尝试加锁时，先偏向，如果后续再进入是同一个线程，则直接用，不加锁
	* 实现上还是要在 MarkWork 中记录下 ThreadId 的，不然无法识别是不是当前线程
2. 轻量锁：轻量级锁对象（Lock Record）创建在当前栈帧，使用 CAS 来尝试确认是否可用，如果失败，再膨胀
3. 锁膨胀（重量锁）：重量级锁对象，在堆中，多个线程争抢

经过这些优化之后，实际上大部分情况，建议直接使用`synchronized`，而不需要自行使用`ReenterLock`手动控制

synchronized 通过在对象头中的标志位来实现相关功能，使用 monitorenter 和 monitorexit 指令实现

### ReenterLock
最常见的、最多用的锁（一般情况建议使用synchronized 代替）

### ReadWriteLock
读写锁，用于指定场景（还没碰到过，不好多说）

### Semaphore
信号量，用于控制多个资源可用的场景，比如资源池类应用时（此处还有疑问）

### Atomic 相关类
基于 CAS 提供的轻量级同步实现，不能称之为锁，但对于并发、同步场景有很多用处，且实现成本低。常见有：
* AtomicInteger
* AtomicLong
* LongAdder

## 分布式锁
用于分布式环境加锁，保证整个运行环境内，只有一个节点上的一个线程可进行当前操作

### 使用 Redis
通常可使用 setnx 指令来达到类似全局 CAS 的功能，但相比于线程中的锁使用，更加需要注意：
1. setnx 指令本身的执行超时
2. 锁标识的有效时间

TODO: 实现来一把

    
    
>资料：
>1. [一分钟理解Java公平锁与非公平锁](https://mp.weixin.qq.com/s/pKUFr-89-1oXfMLHKyGC3Q)
>2. [一次说清，Java 中的各种锁和 CAS 经典面试题](https://mp.weixin.qq.com/s/Pxv176-9d5SHCT9eXS3G-Q)
>3. 《深入理解 Java 虚拟机》周志明
