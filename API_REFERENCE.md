# stock_dashboard_v2 — API 接口参考文档

> 自动生成于 2026-05-09 | 全部端点实测验证通过

---

## 目录

1. [东方财富](#一东方财富)
2. [选股宝](#二选股宝xuangubao)
3. [同花顺](#三同花顺10jqka)
4. [东方财富股吧](#四东方财富股吧jsonp)
5. [自建代理](#五自建代理9yee)
6. [字段编码速查表](#六字段编码速查表)
7. [已知风险与改进建议](#七已知风险与改进建议)

---

## 一、东方财富

**基础域名**：`push2.eastmoney.com`（实时） / `push2his.eastmoney.com`（历史）

**认证**：无需

---

### 1.1 板块/股票列表 — `/api/qt/clist/get`

| 属性 | 值 |
|------|-----|
| URL | `https://push2.eastmoney.com/api/qt/clist/get` |
| 方法 | GET |
| 认证 | 无 |

**核心参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `fs` | 筛选条件（最重要） | `m:90+t:2` 行业板块；`m:90+t:3` 概念板块；`b:BK0477` 某板块成分股 |
| `fid` | 排序字段 | `f62` 按主力净流入排序 |
| `po` | 排序方向 | `1`=降序，`0`=升序 |
| `pz` | 每页条数 | 硬限100 |
| `pn` | 页码 | 从1开始 |
| `fields` | 返回字段列表 | `f12,f14,f2,f3,f62,f184,f66,f69` |

**`fs` 常用值**：

| 值 | 含义 |
|----|------|
| `m:90+t:2` | 行业板块（约496个） |
| `m:90+t:3` | 概念板块 |
| `b:BK0477` | 指定板块成分股 |
| `m:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2` | 沪深A股（主力净流入个股） |

**响应格式**：

```json
{
  "rc": 0,
  "data": {
    "total": 496,
    "diff": [
      {
        "f2": 7054.14,
        "f3": 2.85,
        "f12": "BK1204",
        "f14": "国防军工",
        "f62": 5936220160
      }
    ]
  }
}
```

**注意事项**：
- 单次最多返回100条，资金流页面需分两次请求（流入top100 + 流出top100）
- 停牌股票字段值为 `"-"`，需做类型判断
- 北交所(8/9/4开头)已在前端过滤

**使用页面**：bankuai.js, fund-flow.js, stock-data.js, hotspot_scatter.html

---

### 1.2 单板块/股票详情 — `/api/qt/stock/get`

| 属性 | 值 |
|------|-----|
| URL | `https://push2.eastmoney.com/api/qt/stock/get` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `secid` | 市场.代码 | `90.BK0477` 板块；`1.600000` 沪市；`0.000001` 深市；`0.830799` 北交所 |
| `fields` | 返回字段 | `f12,f14,f2,f3,f62,f184,f66,f69` |

**secid 格式**：

| 市场 | secid前缀 | 示例 |
|------|----------|------|
| 行业板块 | `90.` | `90.BK0477` |
| 沪市主板 | `1.` | `1.600000` |
| 深市主板/创业板 | `0.` | `0.000001` |
| 北交所 | `0.` | `0.830799` |

**注意**：非交易时段返回字段不全（f12/f14/f2/f3可能为空），bankuai.js已做降级处理

---

### 1.3 批量行情 — `/api/qt/ulist.np/get`

| 属性 | 值 |
|------|-----|
| URL | `https://push2.eastmoney.com/api/qt/ulist.np/get` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `secids` | 逗号分隔的secid列表 | `1.600000,0.000001` |
| `fields` | 返回字段 | `f12,f14,f2,f3,f62` |

**使用页面**：hotspot_scatter.html 批量查询成分股行情

---

### 1.4 历史分时 — `/api/qt/stock/trends2/get`

| 属性 | 值 |
|------|-----|
| URL | `https://push2his.eastmoney.com/api/qt/stock/trends2/get` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `fields1` | 基础信息字段 | `f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13` |
| `fields2` | 分时数据字段 | `f51,f52,f53,f54,f55,f56,f57,f58` |
| `secid` | 市场.代码 | `1.600000` |
| `_` | 防缓存时间戳 | `Date.now()` |

**响应关键字段**：

```json
{
  "data": {
    "code": "600000",
    "name": "浦发银行",
    "preClose": 9.09,
    "prePrice": 9.09,
    "decimal": 2,
    "trendsTotal": 256,
    "trends": [
      "2026-05-08 09:30,9.08,9.08,9.08,9.08,0,0.00,9.080"
    ]
  }
}
```

**trends 单条格式**：`{时间},{开盘},{最高},{最低},{收盘},{成交量},{成交额},{均价}`

**使用页面**：theme-trend.html, bankuai_.html

---

## 二、选股宝（xuangubao）

**基础域名**：`https://flash-api.xuangubao.com.cn/api/`
**分时域名**：`https://api-ddc-wscn.xuangubao.com.cn/`
**认证**：无需
**状态码**：成功一律 `code: 20000`

---

### 2.1 涨停板块 — `/api/surge_stock/plates`

| 属性 | 值 |
|------|-----|
| URL | `https://flash-api.xuangubao.com.cn/api/surge_stock/plates` |
| 方法 | GET |
| 认证 | 无 |

**响应**：

```json
{
  "code": 20000,
  "data": {
    "items": [
      {
        "id": 26346142,
        "name": "机器人",
        "description": "Optimus机器人或将于7月下旬..."
      }
    ]
  }
}
```

**字段**：`id`(板块ID), `name`, `description`(涨停原因)

---

### 2.2 涨停个股 — `/api/surge_stock/stocks`

| 属性 | 值 |
|------|-----|
| URL | `https://flash-api.xuangubao.com.cn/api/surge_stock/stocks` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `normal` | 包含普通个股 | `true` |
| `uplimit` | 包含涨停股 | `true` |
| `plate_id` | 过滤特定板块（可选） | `26346142` |

**响应格式**：fields数组 + items二维数组（位置对应）

```json
{
  "code": 20000,
  "data": {
    "fields": ["code", "prod_name", "cur_price", ...],
    "items": [
      ["301369.SZ", "联动科技", 215.88, ...]
    ]
  }
}
```

**fields 索引映射**：

| 索引 | 字段 | 含义 |
|------|------|------|
| 0 | code | 代码（如301369.SZ） |
| 1 | prod_name | 名称 |
| 2 | cur_price | 当前价 |
| 3 | px_change_rate | 涨跌幅（小数，需×100） |
| 4 | circulation_value | 流通市值 |
| 5 | description | 涨停原因 |
| 6 | enter_time | 上榜时间 |
| 7 | up_limit | 是否涨停(boolean) |
| 8 | plates | 所属板块数组 `[{id, name, hot_spot}]` |
| 9 | time_on_market | 上市时间(unix) |
| 10 | turnover_ratio | 换手率（小数，需×100） |
| 11 | m_days_n_boards | M天N板（字符串，如"5天3板"） |
| 12 | report_id | — |
| 13 | report_title | — |
| 14 | report_type | — |
| 15 | report_url | — |

**⚠ 风险**：字段顺序可能变化，stock_monitor_api用`fields.index("code")`硬编码有风险

---

### 2.3 事件历史 — `/api/event/history`

| 属性 | 值 |
|------|-----|
| URL | `https://flash-api.xuangubao.com.cn/api/event/history` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `count` | 返回条数 | `50` |
| `types` | 事件类型（逗号分隔） | `10001,10005,10003,10007,10009` |

**事件类型**：

| 类型码 | 含义 |
|--------|------|
| `10001` | 股票异动 |
| `10005` | 股票快速拉升 |
| `10003` | 板块异动 |
| `11000` / `11001` | 板块异动（news-plates用） |

**响应**：数组，每项含 `event_type`, `event_timestamp`

- `stock_abnormal_event_data`字段：`symbol`(600119.SS), `name`, `pcp`(涨跌幅小数), `mtm`(涨速小数), `price`, `related_plates`
- `plate_abnormal_event_data`字段：`plate_name`, `pcp`, `related_stocks[{name,symbol,pcp,mtm}]`

---

### 2.4 市场情绪 — `/api/market_indicator/line`

| 属性 | 值 |
|------|-----|
| URL | `https://flash-api.xuangubao.com.cn/api/market_indicator/line` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 |
|------|------|
| `fields` | 字段列表 |

**常用fields**：`rise_count,fall_count,limit_up_count,limit_down_count,limit_up_broken_count,limit_up_broken_ratio,market_temperature,yesterday_limit_up_avg_pcp`

**响应**：时间序列数组，每分钟一条

```json
[
  {
    "fall_count": 2981,
    "limit_up_count": 14,
    "market_temperature": 38.35,
    "rise_count": 1492,
    "timestamp": 1778203500
  }
]
```

---

### 2.5 涨跌分布 — `/api/market_indicator/pcp_distribution`

| 属性 | 值 |
|------|-----|
| URL | `https://flash-api.xuangubao.com.cn/api/market_indicator/pcp_distribution` |
| 方法 | GET |
| 认证 | 无 |

**响应**：

```json
{
  "data": {
    "-20": 2, "-10": 3, "-9": 5, ..., "-1": 749,
    "0": 123,
    "1": 1323, ..., "10": 7, "20": 28,
    "halt_count": 333,
    "limit_up_count": 97,
    "limit_down_count": 1,
    "st_limit_up_count": 27,
    "st_limit_down_count": 30,
    "total_count": 5512
  }
}
```

key为涨跌幅百分比（整数），value为股票数量。±20为涨跌停。

---

### 2.6 涨停池 — `/api/pool/detail`

| 属性 | 值 |
|------|-----|
| URL | `https://flash-api.xuangubao.com.cn/api/pool/detail?pool_name=limit_up` |
| 方法 | GET |
| 认证 | 无 |

**响应**：数组，每只涨停股含：

| 字段 | 含义 |
|------|------|
| `symbol` | 代码（如603189.SS） |
| `stock_chi_name` | 名称 |
| `change_percent` | 涨跌幅（小数） |
| `price` | 当前价 |
| `first_limit_up` | 首次涨停时间(unix) |
| `last_limit_up` | 最后涨停时间(unix) |
| `limit_up_days` | 连板天数 |
| `surge_reason` | 对象：`{symbol, stock_reason, related_plates}` |
| `limit_timeline` | 对象：`{items: [{timestamp, status}]}` 涨停封板时间线 |
| `new_stock_acc_pcp` | — |
| `buy_lock_volume_ratio` | 封单比 |

---

### 2.7 板块走势 — `/api/plate/index_realtime`

| 属性 | 值 |
|------|-----|
| URL | `https://flash-api.xuangubao.com.cn/api/plate/index_realtime` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `index_type` | 指数类型 | `1` |
| `plate_id` | 板块ID | `6346009` |
| `data_type` | 1=行业，2=概念 | `1` |

**响应**：

```json
{
  "data": {
    "items": [
      { "time": 1778203800, "index": 1.000967 }
    ]
  }
}
```

`index`为归一化指数（基准=1.0），每60秒一条。

---

### 2.8 分时走势(DDC) — `/market/trend`

| 属性 | 值 |
|------|-----|
| URL | `https://api-ddc-wscn.xuangubao.com.cn/market/trend` |
| 方法 | GET |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `fields` | 字段列表 | `tick_at,close_px` |
| `prod_code` | 产品代码 | `000001.SS` |

**prod_code 格式**：

| 市场 | 后缀 | 示例 |
|------|------|------|
| 沪市 | `.SS` | `600000.SS` |
| 深市 | `.SZ` | `000001.SZ` |
| 北交所 | `.BJ` | `830799.BJ` |

**响应**：

```json
{
  "code": 20000,
  "data": {
    "candle": {
      "000001.SS": {
        "lines": [[1778203800, 4163.8537]]
      }
    }
  }
}
```

`lines`每项：`[unix_timestamp, 价格]`。含 `pre_close_px` 字段作为昨收基准。

**使用页面**：market-index.js, market-style.js, bankuai.js, smart_money.html, stock-compare.html

---

## 三、同花顺（10jqka）

**基础域名**：`https://data.10jqka.com.cn/dataapi/`
**Level2域名**：`https://vaserviece.10jqka.com.cn/`
**认证**：需 `Referer: https://data.10jqka.com.cn/` 请求头

---

### 3.1 涨停板块 — `/dataapi/limit_up/block_top`

| 属性 | 值 |
|------|-----|
| URL | `https://data.10jqka.com.cn/dataapi/limit_up/block_top` |
| 方法 | GET |
| 认证 | 需Referer |

**Headers**：`Referer: https://data.10jqka.com.cn/`（必须）

**响应**：

```json
{
  "status_code": 0,
  "data": [
    {
      "code": "885806",
      "name": "华为概念",
      "change": 1.0013,
      "limit_up_num": 25,
      "continuous_plate_num": 5,
      "high": "5天3板",
      "stock_list": [
        {
          "code": "688260",
          "name": "昀冢科技",
          "reason_type": "MLCC扩产+陶瓷热沉+消费电子",
          "reason_info": "1、据2026年4月24日公告...",
          "change_rate": 20,
          "market_type": "STAR",
          "first_limit_up_time": "1778210991",
          "last_limit_up_time": "1778221248",
          "high": "首板",
          "continue_num": 1,
          "is_new": 0,
          "is_st": 0
        }
      ]
    }
  ]
}
```

**用途**：bankuai.js 的 `fetchLimitUpData()` 用此接口构建涨停Map

---

### 3.2 涨停个股 — `/dataapi/limit_up/limit_up`

| 属性 | 值 |
|------|-----|
| URL | `https://data.10jqka.com.cn/dataapi/limit_up/limit_up` |
| 方法 | GET |
| 认证 | 需Referer |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `page` | 页码 | `1` |
| `limit` | 每页条数 | `15` |
| `field` | 字段列表 | `199112,10,48,1968584,19,3475914,9003,9004` |
| `filter` | 过滤条件 | `HS,GEM2STAR` |
| `order_field` | 排序字段 | `199112` |
| `order_type` | 排序方向 | `0` |
| `date` | 日期（空=今天） | `` |

**响应**：

```json
{
  "status_code": 0,
  "data": {
    "info": [
      {
        "code": "301369",
        "name": "联动科技",
        "change_rate": 17.7613,
        "latest": 215.88,
        "market_type": "GEM",
        "market_id": 33
      }
    ],
    "limit_up_count": {
      "today": { "num": 97, "history_num": 114, "rate": 0.85 }
    },
    "limit_down_count": {
      "today": { "num": 1, "history_num": 3, "rate": 0.33 }
    }
  }
}
```

---

### 3.3 Level2逐笔 — `/Level2/index.php`

| 属性 | 值 |
|------|-----|
| URL | `https://vaserviece.10jqka.com.cn/Level2/index.php` |
| 方法 | GET |
| 认证 | 可能有CORS限制 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `op` | 操作类型 | `mainMonitorDetail` |
| `stockcode` | 股票代码 | `000001` |

**响应**：

```json
{
  "errorcode": 0,
  "pricechange": [{ "1": "202605080930", "2525646": -0.2639 }],
  "list": [{ "tradetype": 1, "value": 0, ... }]
}
```

- `pricechange`：key为时间字符串，value为分钟级主力净流入百分比变化
- `list`：逐笔数据，`tradetype`区分买(1)/卖(2)

**⚠ CORS 风险**：当前smart_money.html用`async:false`同步请求，浏览器可能未来版本禁用同步XHR

**使用页面**：smart_money.html, level2_trades.html

---

## 四、东方财富股吧（JSONP）

| 属性 | 值 |
|------|-----|
| URL | `https://gbapi.eastmoney.com/data/api/Data/GetIndexData` |
| 方法 | JSONP（动态创建script标签） |
| 认证 | 无 |

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `product` | 产品 | `guba` |
| `version` | 版本 | `9005000` |
| `plat` | 平台 | `ipad` |
| `deviceid` | 设备ID | `1` |
| `callback` | JSONP回调 | `__jp0` |

**响应**：`__jp0({"re":[{"time":1778279640000,"value":0.6188}]})`

`value`为0-1的情绪指数，需×100转百分比。

**使用页面**：market-sentiment.js

---

## 五、自建代理（9yee）

**基础域名**：`https://api.9yee.com/`
**认证**：无需

---

### 5.1 日K数据

| 属性 | 值 |
|------|-----|
| URL | `https://api.9yee.com/dayk_proxy` |
| 方法 | GET |

**参数**：`code=sh600000&datalen=240`

**后端**：转发新浪财经K线接口

**使用页面**：dayk_chart.html

---

### 5.2 AI问答

| 属性 | 值 |
|------|-----|
| URL | `https://api.9yee.com/stock_advice` |
| 方法 | POST |

**使用页面**：chat.html, smart_money.html, redball.html

---

### 5.3 个股热点

| 属性 | 值 |
|------|-----|
| URL | `https://api.9yee.com/stock_hotspot/{code}` |
| 方法 | GET |

**使用页面**：stock_hotspot.html

---

### 5.4 个股新闻

| 属性 | 值 |
|------|-----|
| URL | `https://api.9yee.com/stock_news/{symbol}` |
| 方法 | GET |

**使用页面**：stock_news.html

---

## 六、字段编码速查表

### 东方财富 f-编码映射

| 字段 | 含义 | 备注 |
|------|------|------|
| f1 | 市场 | |
| f2 | 最新价/指数 | `"-"`表示停牌 |
| f3 | 涨跌幅(%) | |
| f4 | 涨跌额 | |
| f12 | 代码 | 板块为BKxxxx，股票为6位数字 |
| f13 | 市场编号 | |
| f14 | 名称 | |
| f62 | 主力净流入(元) | 需/1e8转亿 |
| f66 | 超大单净流入(元) | |
| f69 | 超大单净流入占比(%) | |
| f72 | 大单净流入(元) | |
| f75 | 大单净流入占比(%) | |
| f78 | 中单净流入(元) | |
| f81 | 中单净流入占比(%) | |
| f84 | 小单净流入(元) | |
| f87 | 小单净流入占比(%) | |
| f124 | 时间戳 | |
| f184 | 换手率(%) | |

### 股票代码市场前缀

| 开头 | 市场 | secid前缀 | prod_code后缀 |
|------|------|----------|--------------|
| 6 | 沪市主板 | `1.` | `.SS` |
| 0/3 | 深市主板/创业板 | `0.` | `.SZ` |
| 8/9/4 | 北交所 | `0.` | `.BJ` |

---

## 七、已知风险与改进建议

| # | 风险 | 影响 | 建议 |
|---|------|------|------|
| 1 | 选股宝stocks接口字段位置索引硬编码 | 字段顺序变化直接崩溃 | 改用fields数组做映射 |
| 2 | 东方财富clist/get单页100条限制 | 概念板块(>500)有遗漏 | 实现分页遍历 |
| 3 | 同花顺Level2用同步XHR(async:false) | 未来Chrome版本可能禁用 | 改为异步+回调 |
| 4 | 除stock-data.js外无本地缓存降级 | API失败直接显示错误 | 加localStorage缓存 |
| 5 | 多页面30秒轮询无节流 | 并发请求量较大 | 加请求节流/防抖 |
| 6 | 北交所pre_close_px为0 | 涨跌幅计算异常 | 用首笔成交价替代 |
