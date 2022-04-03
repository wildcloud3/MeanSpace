---
title: Spring IoC
author: Li Zhuliang
date: 2020-03-12 06:15:15
---

比较散，还不能理解成一个整体

## 几个关键点：
### beanFactory
* 用不同的 IoC 容器（Context）可以用不同方式创建：Xml、Annotation 等
* 不同的 Bean 类型会有不同生成方式，主要有：
    1. singleton，常用的方式
    2. prototype，每次生成一个
    3. 和 springmvc 相关的，跟request, session 等周期相关
* Bean 的获取（无论第一次还是后续），本质上最后都是去了 doGetBean，brief 流程：
    1. 尝试从 singleton 缓存中取，是否已有实例：`org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#getSingleton(java.lang.String)`
    2. 已经有，则实例化之，并在`convertIfNecessary`中进行类型转换
    3. 如无singleton 缓存，且是 prototype，则创建Bean 并类型转换
    4. 根据 RootBeanDefinition 创建 Bean
    5. 以上涉及到创建时，均需要判断是否是 FactoryBean，如是 FactoryBean 还需要使用 FactoryBean 进行创建，类似`SalukiReferenceBean`
        * 而是否 FactoryBean 的认定是使用 BeanName 的前缀进行的，一般为`&`
    6. 实例化过程中，会检查 mbd 的 dependsOn，这个是Bean 创建依赖树上的依赖，而不是常说的依赖注入的依赖（确实正确的实例化顺序）
    7. 最后对于 Singleton 的创建会走到`org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#createBean(java.lang.String, org.springframework.beans.factory.support.RootBeanDefinition, java.lang.Object[])`，其中的 doCreateBean中的 populateBean 就是依赖注入的核心了
    8. Spring 的 AOP 就是在上述 7 的过程中，使用 `InstantiationAwareBeanPostProcessor`来进行处理的
    9. 最终的 BeanCreation 是出来一个 BeanWrapper，用于注入不同的属性
* Autowired 和 Resource 区别在于，前者用AutowiredAnnotationBeanPostProcessor 处理，后者用 CommonAnnotationBeanPostProcessor 处理，区别在postProcessPropertyValues`上，两个的处理注入的函数不一样
    * 明面上区别在于，Autowired 先类型后名字（隐性）；Resource 先 name，后类似 Autowired

### BeanDefinition 如何来
* mbd 会贯穿 spring 启动的整个流程，是创建用的基础数据
* 核心容器 ApplicationContext 启动时，会扫描所有需要的bean 并注册到容器中；启动时，会把 xml 的描述或者 Annotation 转化成 BeanDefinition
* 一般来说一个 Spring 容器（如 ApplicationContext中），会有两个Map，一个beanName-->Bean，另一个 beanName-->BeanDefinition
* xml 中声明的 property 注入，实为 set 注入；注意：
    * ref 是注入依赖，这个注入是一个递归过程
    * value 是属性
* 可以用 CustomAutowireConfigurer 来添加自己的 AnnotationType 来调整执行注入过程
* 此处`org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor#buildAutowiringMetadata`是进行 Annotation Autowire 的 Metadata 生成的启点
- TODO: 看下 mbd 的分析代码

### BeanPostProcessor
* 六大知名：
1. ConfigurationClassPostProcessor
2. AutowiredAnnotationBeanPostProcessor
3. CommonAnnotationBeanPostProcessor
4. Jpa的 PersistenceAnnotationProcessor
5. EventListenerMethodProcessor
6. DefaultEventListenerFactory
* 可自己继承实现 BeanPostProcessor 接口，来对 Bean 的实例化过程进行干预
    * 但如果在自己实现的 bpp 中引用了业务bean，会导致业务 bean 过早初始化，如果此业务 bean 上有类似`@Async`的注解，则 Async 功能会失效（原因是，Async 是通过 AsyncAnnotationBeanPostProcessor 实现的，给他创建一个代理，但此时此 async bpp 还没注册上，自然没法创建合适的代理对象）
* 动态 Aop 使用了：`AnnotationAwareAspectJAutoProxyCreator`

### 代理
Cglib|JDK 代理
--|--
改写字节码|Proxy
动态生成子类|包一个 Proxy
创建性能低，但调用性能好|反之
无法对 private 和 final 方法代理（因其为动态子类）|-

### 其它
* `@Lazy`的话，会先有 beanDefinition 信息，会注册上，但不会实例化，即不会提前调用创建方法
    * Lazy 注解会在注入时生成一个代理对象，只有在真正执行目标方法时才会去容器中拿真正的bean 实例
* 依赖注入的几种方法的对比
方式|优点|缺点
--|--|--
Set 注入|单例下可解决循环依赖|额外配置 set 方法，不能保证注入完整性
构造器注入|可以保证注入的完整性|需要相应的构造器，无法解决循环依赖
Field 注解|简洁，单例下可解决循环依赖|依赖关系不明显，可能会注入一个 null（可以用@Required显示说明）

- TODO: 有没有办法选定一批 Bean 指定 Lazy 初始化
- TODO: Bean 的循环依赖 Spring 是怎么解决的
    * 只有 Singleton 的才能解决循环依赖，Prototype 的Bean 无法解决循环依赖，因为 Prototype 下的 Bean 不是共享的，如果循环，则会不断创建新的 prototype
    * singleton 时，spring 通过提前暴露beanFactory 来解决循环依赖
        * 如果 A 中有 B，B 中有 A，当 Inject 时，A 还未创建完成时，因为实例化 A 依赖了 B 的 bean，进而需要再实例化 A，此时调用的提前暴露的单列工厂的实例化方法，实际上获得的是同一个引用
        * 在`doCreateBean`中，如果可以循环引用，则会将一个beanName-->创建闭包加入到 singletonFactory 中，以供引用
    * 个人理解，将对象的创建、初始化分离，类似 C++中的 new 和 构造
