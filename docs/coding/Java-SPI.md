---
title: Java SPI
author: Li Zhuliang
date: 2020-03-21 14:10:27
---
## 先说说双亲委派
说是双亲实际上由于 Java 的单继承，只是往父类委派，可以保证每个类都是由其合适的 ClassLoader 所加载。自JDK1.2 开始有的，但也是一个建议，建议 ClassLoader 按照这一方式去做，相对来说更安全，不会出现恶意 String 类被AppClassLoader 加载替代 rt.jar 中的 String 之类的情况。

* 双亲委派的实现中，并不是用继承，而是组合，有一个显式的 parent ClassLoader。在`loadClass`时，先尝试由 parent 加载，如果没有，才由自己加载
	* 注意：对于ClassLoader 来说，如果 `== null`，意味着是 BootstrapClassLoader

* 不接受建议的情况：OSGi，自己实现了 ClassLoader，是类似于图的依赖关系来加载类。看的资料上没说是 DAG，所以其存在循环依赖的问题，可能在加载时导致两个Bundle 的 ClassLoader 互相死锁

## 再说说为什么要 SPI
一般的说法就是，类似于 `java.sql`中的接口定义在 rt.jar 中，但往往实现是由三方完成，BootstrapClassLoader 无法知道三方的情况，所以通过这么一种约定来实现，接口由 BootstrapClassLoader 加载，实现类由 ApplicationClassLoader 加载。主要有以下几点：
0. 对，是对双亲委派的破坏，但确实是实际需要
1. 由`java.util.ServiceLoader`来负责对这样的实现类进行加载
2. 具体加载哪些实现类，由放在`META-INF/services/`的文件描述，文件名为接口全称，内为实现类全称
3. ServiceLoader 加载实现类时，使用的不是 BootstrapClassLoader，而是线程中的 `Thread Context ClassLoader`，一般来说就是 ApplicationClassLoader

### 类比 Spring 的 FactoryLoader
同样的，Spring 中为了实现自动配置，也是按照类似SPI的约定来达成的，但 Spring 主要是为了加载配置类，SPI 是为了加载实现类。差别：
1. 由`org.springframwwork.core.io.support.SpringFactoriesLoader`来实现加载
2. 具体的加载文件，在`META-INF/spring.factories`，当然文件中内容是按 Spring 的格式要求来的
3. Spring 加载过程中，显式调用，还比较早就触发了

### 类比 Dubbo
这个没细看，因为一直没接触 Dubbo，实现的更加复杂一些，简单认为：规则更多，介入能力更强，主要实现在 Dubbo 的 ExtensionClassLoader 中，后续有空再看

## 题外：被破坏的双亲委派
一般认为有三种双亲委派的破坏情况：
1.  由于历史原因（为了兼容），现在建议的实现`findClass`的委派加载逻辑，之前是没有的，之前就是继承`loadClass`。但双亲委派的核心逻辑就是实现在`ApplicationClassLoader.loadClass`中，可能通过 Override 此方法来实现破坏
2. SPI，为了加载由核心类库实现接口，而外部三方提供实现类的情况
3. 为了实现代码热替换、模块热加载等（OSGi 就是这个情况）







