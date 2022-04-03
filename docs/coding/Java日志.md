---
title: Java日志
author: Li Zhuliang
date: 2020-03-12 06:15:47
---

## LogBack 是 Slf4j 的一个实现
* Slf4j 中的 f 是 Facade
* 在配置 logback.xml 时，注意完整，如果没有合适的 logger or root section，就相当于没配置
* 新版本中已经不用 layout 了，而是用 encoder
* 涉及到 SpringProperty 的使用，需要用 `logback-spring.xml`，会有 spring 加载后加载，可以使用 application.properties 中定义的变量
* 阿里云的SLS appender倒是一用就好

### 日志级别的几个建议
1. ERROR
    * 影响到程序正常运行、当前请求正常运行的异常情况
    * 如果进行了抛出异常操作，请不要记录error日志，由最终处理方进行处理
2. WARN
    * 不应该出现但是不影响程序、当前请求正常运行的异常情况
    * 即将接近临界值的时候，例如：缓存池占用达到警告线
3. DEBUG
    * 需要先进行 log.isDebugEnabled 判断，再记录
    * **推荐大家用 SLF4J 的门面接口，可以用参数化形式输出日志，debug 级别也不必用 if 判断，简化代码**

### 日志应当包括内容
* 日志时间
* 日志级别主要使用
* 调用链标识（可选）：TraceID 和 SpanID
* 线程名称
* 日志记录器名称
* 日志内容
* 异常堆栈（不一定有）

### 日志框架
log4j、Logging、commons-logging、slf4j、logback，开发的同学对这几个日志相关的技术不陌生吧，为什么有这么多日志技术，它们都是什么区别和联系呢？
1. Logging
这是 Java 自带的日志工具类，在 JDK 1.5 开始就已经有了，在 java.util.logging 包下。通常情况下，这个基本没什么人用了
2. commons-logging
commons-logging 是日志的门面接口，它也是Apache 最早提供的日志门面接口，用户可以根据喜好选择不同的日志实现框架，而不必改动日志定义，这就是日志门面的好处，符合面对接口抽象编程。现在已经不太流行了（不过 SpringBoot 内好像还是用了这个）
3. Slf4j
slf4j,英文全称为“Simple Logging Facade for Java”，为java提供的简单日志Facade。Facade门面，更底层一点说就是接口。它允许用户以自己的喜好，在工程中通过slf4j接入不同的日志系统。
它不负责具体的日志实现，只在编译时负责寻找合适的日志系统进行绑定。具体有哪些接口，全部都定义在slf4j-api中
4. Log4j
Log4j 是 Apache 的一个开源日志框架，也是市场占有率最多的一个框架
log4j 在 2015.08.05 这一天被 Apache 宣布停止维护了，用户需要切换到 Log4j2上面去
5. Log4J2
Log4j2与Log4j1发生了很大的变化，log4j2不兼容log4j1。
6. Logback
Logback 是 Slf4j 的原生实现框架，同样也是出自 Log4j 一个人之手，但拥有比 log4j 更多的优点、特性和更做强的性能，现在基本都用来代替 log4j 成为主流

## 日志 PaaS/SaaS 服务
### 阿里云 SLS
有一个github 开源的 appender，能用，但不完全方便
* 不需要 layout，因为不设置 encoder 时，就没有 log，按 logContent 类似 key-value 推送数据上去就 ok
* 但需要管理好 MDC，不自己实现的话，只能从 MDC 上取extra 字段
* 建议可以继承 slsAppender，扩展下 logContent 的字段注入
* 或者参考并自行实现，据说依赖的 Producer 0.3 版本已经改了接口，此处依赖的 0.2已经不再维护了
* 再或者维持当前 java-->logstash-->sls的路数，改进下 log-starter 就好，善用 logback
