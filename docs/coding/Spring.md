---
title: Spring
author: Li Zhuliang
date: 2020-03-12 06:16:44
---

## Spring
### Spring MVC
#### 关于 Interceptor 和 Filter
引用自StackOverflow：
> fine-grained handler-related preprocessing tasks are candidates for HandlerInterceptor implementations, 
> especially factored-out common handler code and authorization checks. 
> On the other hand, a Filter is well-suited for request content and view content handling, like multipart forms and GZIP compression.
> This typically shows when one needs to map the filter to certain content types (e.g. images), or to all requests.

所以来说，做验证码校验的逻辑，应该是用 Interceptor 更为合适。But 由于 Filter 在 Interceptor 之前执行（优先级高，更底层），用 Interceptor 无法拦截到非法登录请求，还是要用 Filter。

* Filters are called by your Server(tomcat). while Interceptors are called by Spring.
* filter is always executed BEFORE the preHandle interceptor method.
  * interceptors are part of Spring MVC which begins at DispatcherServlet. Filters are called before servlets.

  
![upload successful](https://cdn.jsdelivr.net/gh/wildcloud3/image_bed@master/2022/04/upgit_20220403_1648992562.png)
* 最后用了 httpSecurity 的 addFilterBefore 在用户名密码验证前加了个 GeetestFilter

### Spring Boot
#### 环境变量获取的 hack 逻辑（SpringBoot 2 中变化了很多，但还是支持的）
* 在 properties文件中一般是 a.b.c，但在环境变量中，A_B_C 也是可以被 DataBinder 到的，代码见：RelaxedDataBinder::getPropertyValuesForNamePrefix，会处理`_ 和 .`的分隔符
* 大小写变换的逻辑，在这个类：RelaxedNames

#### 运行时配置
1. 准备多个 application-dev.properties, application-prod.properties，可以用 spring.profiles.active=xxx 来激活
2. 部署时，根据优先级，在 java -jar -Dspring.profiles.active=prod 来激活
3. 有 Apollo，Spring Cloud Bus，应该是用不到这个了

#### @RestController 对于 response 的 POJO 会自动用 Jackson 搞成json，这时时间类型的序列化会是个问题
* Java8 之前，Date 类型，直接在注解上 `@JsonFormat(pattern = 'yyyy-MM-dd')`
* Java8 之后，LocalDate 相关类型，只上面不够，需要引入新的依赖

```
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
    <version>2.8.8</version>
 </dependency>
```

* 实现机制：
1. 对于不指定的 POJO 返回，会默认调用到 Jackson 的 ObjectWriter
2. 会 resolve 到相应的 ValueSerializer
3. 第一次访问到这个时，BeanSerializerBase这个会构造（Lazy 的）
4. 里面的 BeanPropertyWriter 里面有个_member 就是对应的类反射数据
5. 可以根据_member 上的 Annotation 来构造相应的 Formatter

#### PropertySources 相关
  * 在 populate Bean 时，对于`@Value`的 field，会尝试各种 resolver，到最后，会落到一堆 propertySouces 上，Genrally，越后被定义到的@PropertySources，会越先win
  * 一个小问题，使用 app.setDefaultProperties 得到的 propertySource 是最低（最先定义）Priority 的 PropertySource，会被从 config-bus 那边的 CompositePropertySource 覆盖掉
  * 转而设置 property 在 env 中，会用到 EnvironmentPropertySource 就可以了

#### 如何优雅地用 factory strategy模式
1. 自己定义一个 annotation on runtime
2. 给各个 handler/strategy/impl 上加这个 annotation，并指定好各自不同的type/value/sort 等
3. 加一个 BeanFactoryPostProcessor 的实现，在beanFactory 初始化完成后，扫描指定包下含有此 annotation 的 class
4. 提取此 annotation 中的 value，和对应的 class 的 impl做成一个 map，可以在 factory 中使用
  * 如果使用 `@Autowired SomeInterface handlers[]` 这样的方式，一定要给所有的 impl 弄成bean，会需要多考虑一些线程问题
