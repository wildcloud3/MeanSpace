---
title: MySQL
author: Li Zhuliang
date: 2020-03-29 07:03:41
---

## 5.7新功能
* Json 类型字段
    * 另外的字段可以设置为由某个 Json 字段抽取的值，Virtual 类型
    
## 运维功能
* Binlog 的一点小知识
    * `binlog_format = ROW`，对于同样数据的更新不会执行；`binlog_format = STATEMENT`，对所有语句都好好执行
        row 的 binlog 关注点在记录上，statement 的 binlog 关注点在语句上
        
## 索引
* Unique Index 的一个不算坑的坑
    不要使用 Null 值，看起来 null 值的处理优先级高于唯一性，会不管用，多个 null 可以并存于 unique index 中
    
### 聚簇索引
比较两个查询：
```
select * from test where val=4 limit 300000,5;
select * from test a inner join (select id from test where val=4 limit 300000,5) b on a.id=b.id;
```
两个语句的查询结果是一样的，但是前一句的效率很底，后一句快很多，原因是：
1. 1 中查询时，直接走了聚簇索引（因为要返回*），导致所有前续 30w 记录都白查，浪费时间在 IO 上
2. 2 中，子查询只使用了索引，IO 方面可以认为是 O（1），如果在内存中；再 join 时才使用聚簇索引，所以快
    
## 字段类型
* 对于 Date 类型的字段，MySQL 允许一个 "zero" value（0000-00-00 这样的），作为一个 dummy date
    * 好处是，in some cases convenient than NULL；使用 less data 和 index space
    * 坏处是，Java 那边，如果 DO 直接写 Date 类型，又没指定这个  zeroDateTimeBehavior，就会抛错
    
## 主键上限
* 对于显式声明主键的表，如果 id 为 uint，可能在(2^32)最大后，写入不了，此时处境 id 为 `2^32-1`，如果为 bigint unsigned，一般来说不会有问题了
* 但对于无主键声明的表
    * innoDB 会自动创建一个长度为 6 字节的 row_id
    * 并且这个 row_id 是全局共用的，也就是说，多个表全局共用这一个
    * 如果条目多到 2^48-1 后，下一个 row_id 是低 48 位为 0，可能就冲突了
    
    
