---
title: TCP BBR 是个什么玩意儿
author: Li Zhuliang
date: 2020-03-12 06:20:17
tag:
  - 计算机
  - 网络
---
# {{ $frontmatter.title }}

## BBR是个什么东西：
TCP BBR（Bottleneck Bandwidth and Round-trip propagation time）是由Google设计，于2016年发布的拥塞算法。
以往大部分拥塞算法是基于丢包来作为降低传输速率的信号，而BBR则基于模型主动探测。
该算法使用网络最近出站数据分组当时的最大带宽和往返时间来创建网络的显式模型。
数据包传输的每个累积或选择性确认用于生成记录在数据包传输过程和确认返回期间的时间内所传送数据量的采样率。

Google在YouTube上应用该算法，将全球平均的YouTube网络吞吐量提高了4%，在一些国家超过了14%。
根据实地测试，在部署了最新版内核并开启了 TCP BBR 的机器上，网速甚至可以提升好几个数量级。

[官方介绍](https://cloud.google.com/blog/products/gcp/tcp-bbr-congestion-control-comes-to-gcp-your-internet-just-got-faster)

## 设计思想：
主要是针对大带宽，浅 buffer（我的理解是带宽大了深不起来）的现代互联网场景设计

* 理解提升：
	之前的基于 loss 的 CC 也是合理的，处理了当时 99%的情况；而今，基础不同后，新的 99%情况也不同，所以需要另外一种方法来处理；可能之后，99%的情况又不同了，还会有新的方法的；所以持续地统计、观察这个拥塞情况，才能做高层设计

* 理解提升：
  之前的基于 loss 的 CC 也是合理的，处理了当时 99%的情况；而今，基础不同后，新的 99%情况也不同，所以需要另外一种方法来处理；可能之后，99%的情况又不同了，还会有新的方法的；所以持续地统计、观察这个拥塞情况，才能做高层设计


## 以下原文
What is BBR?

BBR ("Bottleneck Bandwidth and Round-trip propagation time") is a new congestion control algorithm developed at Google. Congestion control algorithms — running inside every computer, phone or tablet connected to a network — that decide how fast to send data.
How does a congestion control algorithm make this decision? The internet has largely used loss-based congestion control since the late 1980s, relying only on indications of lost packets as the signal to slow down. This worked well for many years, because internet switches’ and routers’ small buffers were well-matched to the low bandwidth of internet links. As a result, buffers tended to fill up and drop excess packets right at the moment when senders had really begun sending data too fast.

But loss-based congestion control is problematic in today's diverse networks:

In shallow buffers, packet loss happens before congestion. With today's high-speed, long-haul links that use commodity switches with shallow buffers, loss-based congestion control can result in abysmal throughput because it overreacts, halving the sending rate upon packet loss, even if the packet loss comes from transient traffic bursts (this kind of packet loss can be quite frequent even when the link is mostly idle).
In deep buffers, congestion happens before packet loss. At the edge of today's internet, loss-based congestion control causes the infamous “bufferbloat” problem, by repeatedly filling the deep buffers in many last-mile links and causing seconds of needless queuing delay.
