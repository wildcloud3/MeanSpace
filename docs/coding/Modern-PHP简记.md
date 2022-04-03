---
title: Modern PHP简记
author: Li Zhuliang
date: 2020-03-12 07:21:51
---

1. PHP闭包对象可以使用$this，其默认实现仅有一个__invoke和bindTo()，但通过bindTo()可以改变绑定闭包的上下文，如：`$routeCallback->bindTo($this, __CLASS__)`

2. PHP从5.5.0开始，就内置了OPCache功能，在生产环境中，应当设置`opcache.validate_timestamps=0`

3. PSR标准：单独开发的框架没有考虑到和其他框架的通信，这样的开发效率很低，无论是对开发者还是框架本身，所以搞了几个PSR（PHP Standards Recommendation）

    * PSR-1，基本的代码风格

    * PSR-2，严格的代码风格，laravel并没有使用PSR-2

    * PSR-3，日志记录器接口，每个日志方法的接口，第一个参数$message应当是一个（等效）字符串，第二个参数应当是一个$context（kv array）用于替换第一个$message里面的点位标记

    * PSR-4，自动加载

4. 为什么composer？或者说，为什么那么多包管理工具，感觉这个和当前盛行的微服务也很象，社区本身不再产出大而全的框架，反而是通过几个不同的组件、模块沉淀出一套标准，再套用这一标准实现了一大堆有共同沟通基础的库，在代码、库的组织管理层面，微框架化应该是已经完成的趋势

5. 有个Aura的php框架之前没怎么听闻过，看了下，还是比较老的思想Page->index这样的，不深入了，有laravel和swoole的坑应该是够了

6. composer仓库可以私有建一个，对应的composer登录凭据也会保存在auth.json中，这个和之前的gradle和maven的配置有点像

7. PHP作为一个给网络用的框架，确实也有不少这方面的记计，被用的比较少的一块，但确是PHP网站中相当重要的一部分，参数过滤，filter_xxxx这类函数，很多validation都可以这么搞，laravel的validation底层估计也是用的这个吧

    * 更多的HTML过滤，还有个库，HTML Purifier，可以防止XSS、注入

    * 同样，对于数据库，最好用PDO预处理语句，也可以防止注入

8. 密码最佳实践，尽量用新的password_hash，并用password_need_rehash来定期更新hash值

9. 对于Date相关的，也已经引入了不少新的类，如DateTime，DatePeriod，DateInterval之类的，用于计算周期可选时间列表还是比较表意的

10. PDO的fetchColumn可以只拿一列，和Eloquent::list有点像，但laravel的底层好像是自己用内存做的，并不会优化到list，确认了下，为了统一化sql的生成，全部是通过抽象类生成sql后，直接pdo查询的，全文搜索了下，也确实没有用到相关的函数

11. PHP的错误报告有时候设置会比较混乱，建议是生产环境全部off并log errors，并报告E_ALL & ~E_NOTICE，这块感觉还是PHP7处理的比较好了，不可fatal的都可以catch了

12. Apache运行的模式：安装apache的mod_php模块，apache web服务器会给每个PHP请求派生一个专门的子进程，并在子进程中嵌入专门的PHP 解释器，即使是静态资源的访问也会有同样的处理，所以资源消耗大。

    * nginx+php-fpm方式，就用nginx代理掉了很大部分的静态资源请求，可以有效降低资源消耗

    * PHP-FPM（PHP FastCGI Process Manage），是用来管理php进程的，主要管理要留存多少个进程，及接受请求数，时长等行为

13. 可以使用PHP Iniscan工具来检查php.ini的文件配置是否安全

14. PHP配置中有一项realpath cache用于缓存path，默认是16k，真实值需要测定，可以先设置一个大的，再在最后打一个realpath_cache_size()来看看，用了多少

15. 作者在写的时候，还流行用Capistrano之类的发布管理，用于维持版本、回滚，唉，变化快啊，现在已经全面docker了

16. 关于调试，可以使用xdebug生成CacheGrind的文件，使用WinCacheGrind，KCacheGrind，WebGrind等都可以来看这个结果

    * 在生产环境的话，最好是不要开xdebug，可以用xhprof，这个也是facebook搞的，也算是APM的一种吧

    * 当然现在也有很多侵入式的在线分析的：New Relic，Blackfire，可惜价格挺贵

17. 提升PHP性能上，除了HHVM还有Hack（可惜没能打开官网），不过感觉上将被PHP7取代

    * 尤其是Hack，不少语言级别的特性，在PHP7上已经全部有体现了

