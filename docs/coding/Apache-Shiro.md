---
title: Apache Shiro Notes

author: Li Zhuliang

tag:
  - Shiro
  - Java
category:
  - 应用开发

date: 2020-03-18 08:43:00
---

# {{ $frontmatter.title }}
Shiro 是 Apache 下的一个开源权限管理框架，个人理解为，authentication 和 authorization 领域的一个抽象和实现。
可以快速、方便地集成到 web 中，非 web 的话，套用其一整套元语，用于权限相关的设计和开发，也是十分便利的

## 主要组成部分

![shiro 框架](https://cdn.jsdelivr.net/gh/wildcloud3/image_bed@master/2022/04/upgit_20220403_1648991896.png)

### subject
直译为“主体”，这个权限系统中，进行操作、被进行权限验证的主体，比如用户、应用、客户端等

此处 subject 是 shiro 中必然存在的，但不一定是 authenticated，更不一定对当前访问是 authorized

#### principle
构成 **subject** 的核心要素，比如 username 之于用户，appName 之于应用

### securityManager
shiro 实现的核心所在，**subject**一般不进行操作，全部delegate 给securityManager 进行处理

### Realm
数据落地的地方，和*你*开发的应用逻辑相接壤的地方

通常用于实现，authentication 和 authorization 的逻辑

### 其他概念
1. session && sessionManager
2. sessionDAO
3. cache && cacheManager
4. authenticator
5. authorizer
6. cryptography

## 为什么
Shiro本身只是权限这一领域的设计，不包含业务的逻辑，不论是使用接口、配合 serverlet 的 filter，配合 spring 的 annotation，都可以快速明确地进行权限验证及 authc&authz 对接

比起自己实现一套类似的，可扩展性更强

当然，粗看下来，Shiro 的实现，跟传统 web 结合更好一些，本身是领域抽象，但没有看到对微服务的对接，对 serverlet、standalone、spring 的对接包都有

## 怎么用
![shiro detail](https://cdn.jsdelivr.net/gh/wildcloud3/image_bed@master/2022/04/upgit_20220403_1648991926.png)

### 基本使用
1. 继承实现**AuthorizingRealm**，自行实现 authc 和 authz 逻辑
	* 在 Realm 的实例化时，也需要指定使用的 CredentialsMatcher，就是用于比对密码的
    * 可以通过继承`AuthenticationToken`来实现自己业务需要的 Token 形式，并在 Realm 中继承`supports`来实现不同的 Token 走不同的 Realm，这样可以做到统一 Session 不同用户来源（及匹配不同的用户登录要素）
2. 在代码中直接使用 `SecurityUtils.getSubject()`，进行 login、logout、checkRole、isPermitted 之类的操作

### 和web 一起用
3. 在 serverlet 的 Filter上加一个，ShiroFilterManager（会自动代理掉原来的 FilterChain，意味着，ShiroFilter 早于ServerletFilter

### 如果是 Spring
4. 上述一步的过程，可以使用一个`ShiroFilterFactoryBean`来自动实现，只需要配置相应的 filterDefinitionMap
5. 再用一个`AuthorizationAttributeSourceAdvicsor`来切面
6. 在访问的方法上加相应的`RequiresPermissions`, `RequiresRoles`就可以相应地进行权限拦截

### 如果要增强一下缓存
Shiro并没有实现缓存，但抽象了 Cache 和 CacheManager 的接口，可用于扩展，可以通过实现上述两个接口，并在 securityManager 实例生成时注入

### 如果要增强下 Session
同缓存类似，通过对 SessionDAO 和 SessionManager 的实现，并在 securityManager 实例化时注入，可以实现session 的增强
* 如果要做分布式的，就需要用统一的 sessionDAO 来增强，一般用 Redis
* 此处对 SessionDAO 的增加时，也可以自定义 sessionId的生成逻辑，注入自己实现的 sessionIdGenerator 即可
* 此处对 SessionManager 中 getSessionId 方法的继承，也可以实现从指定的 header 中取sessionId 的逻辑（比如 Token），默认的实现中，会先尝试从 Cookie 中取sessionId，若未取到，再尝试 urlParams 上的
	>注意：自己实现了 getSeesionId, 如果有取到，需要设置对应的 request 的attributes, 如下
    
``` 
request.setAttribute(ShiroHttpServletRequest.REFERENCED_SESSION_ID_SOURCE, REFERENCED_SESSION_ID_SOURCE);
request.setAttribute(ShiroHttpServletRequest.REFERENCED_SESSION_ID, token);
request.setAttribute(ShiroHttpServletRequest.REFERENCED_SESSION_ID_IS_VALID, Boolean.TRUE);
```

## 特别指出
### 关于一个实例中的bug
* 问题：
    学习过程中，用了一个`org.crazycake:shiro-redis`的一个 redis 增强 Cache 和 Session 的实现，这个类库写的还是不错的，比较小且全（对各种 Redis 模式的支持），但有个问题，使用的 Jedis 有点旧了，跟其它引用的版本冲突了，有一个`scanResult.getStringCursor()`的接口，新版本中已经没了
    
* 解决：
	1. 继承其`BaseRedisManger`的实现，用新的接口实现一下，依赖注入时，使用继承的这个类就好了
	2. 应该也可以通过 pom 那边操作，调整依赖来解决冲突
