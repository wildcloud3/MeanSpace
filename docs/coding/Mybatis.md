---
title: Mybatis
author: Li Zhuliang
date: 2020-03-12 06:18:35
---

## 使用
直接引入就可以用了，starter，约定大于“一切”
```
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.0.0</version>
</dependency>

<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.1.10</version>
</dependency>

<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>5.1.28</version>
    <scope>runtime</scope>
</dependency>
```

### 配置相关
1. 常规的几个配置项是给 Datasource 的：
```
spring.datasource.url=jdbc:mysql:///test01?useUnicode=true&characterEncoding=utf-8 spring.datasource.username=root spring.datasource.password=root spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
```
> 一般看到要声明 driver-class-name 的，应该是用了 jdbc，druid 不用
2. 可以在 properties 配置中指定相关 mybatis 的配置
```
mybatis.config-location=classpath:mybatis-config.xml
mybatis.mapper-locations=classpath:mapper/*.xml
mybatis.type-aliases-package=space.mean.learn.dataobject
```
> 在声明`mybatis.type-aliases-package`后，resultType 这类可以不用写全类 Referrence
> 几个 xml 在写的时候要当心`<!DOCTYPE` 这一行不可省，反正少了也启动不了
3. 以上配置也可以自行写`@Configuration`实现，但比较繁琐，常规来说 mybatis 的 config 还是会写成 xml

### 自动配置的实现
在 SSM 整合中，开发者需要自己提供两个 Bean，一个SqlSessionFactoryBean ，还有一个是 MapperScannerConfigurer，在 Spring Boot 中，这两个东西虽然不用开发者自己提供了，但是并不意味着这两个 Bean 不需要了，在 org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration 类中，我们可以看到 Spring Boot 提供了这两个 Bean

**注意配置 `@MapperScan`**

## 功能增强
### MyBatis-Plus
为了简化开发而生，提供了常用的查询包装及基本的 CRUD 操作，不用生成 xml 了，同时也支持扩展 xml
```
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus</artifactId>
    <version>3.3.1</version>
</dependency>
```
但分页接口风格不同于 PageHelper，使用上要注意


## JDBC
1. 当 JDBC 类型是 Date 且数据为'0000-00-00'的错误数据时，DO 中对应字段如果设置为 Date，会有异常，Zero Date value prohibited
2. 简单处理
    * 把 DO 中的字段类型设置为 String
    * 在 JDBC 的 connection String 中加一个参数：`zeroDateTimeBehavior=convertToNull`，就会把全 0 的当成 null 处理
3. 2B 处理
    * 在 Mybatis 的结果集映射的 Result 中，设置一 property，typeHandler，自己去继承下对应的 TypeHandler（此处为 DateOnlyTypeHandler），override 下 getNullableResult
4. 上述过程的机制
    1. 默认行为中，会使用 `com.mysql.cj.jdbc.io.JdbcDateValueFactory::createFromXXXX` 来创建对应 DO 的 Date，此时全 0 的时间，会抛个 DataReadException
    2. 当使用 `zeroDateTimeBehavior=convertToNull` 时，在 `com.mysql.cj.jdbc.result.ResultSetImpl::ResultSetImpl` 构造时，读取这一参数，并使用 decorate factory模式，按不同behavior 生成不同的 valueFactory；此处，如果是 convertToNull 的话，会生成 ZeroDateTimeToNullValueFactory，该类的 createFromXXX 在碰到全 0 时，不会抛错，直接`return null`
    3. Mybatis 中，会使用 TypeHandler 处理返回值，也可以方便自己扩展，当然底下是调用了 JDBC；是在 `getPropertyMappingValue` 中间接调用到的
    4. 上述中 TypeHandler 在处理，类似 `terra_entry.attributes`的反序列化场景时，还比较有用
