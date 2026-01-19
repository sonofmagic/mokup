# 从 DTS 生成 Mokup 随机数据的提示词模板

这些模板面向“直接生成可写入 `*.get.json` 的响应 body”。你只需要把 `{...}` 占位符替换成真实内容即可。

## 占位符说明

- `{spec}`: 你的 dts 原文
- `{target}`: `TypeName` 或类型别名描述
- `{count}`: 数组条数（例如 10）
- `{seed}`: 随机种子（字符串即可，例如 `mokup-42`）
- `{locale}`: 语言区域（例如 `zh-CN` 或 `en-US`）
- `{optional_ratio}`: 可选字段取值概率（0~1，例如 0.7）
- `{null_ratio}`: 可空字段为 null 的概率（0~1，例如 0.1）

---

## 方案一：单步模板 + 兜底修复模板（推荐）

### 主生成模板

```text
你是一个严格的 JSON 生成器。只输出 JSON，不要解释、不要 Markdown。

任务：根据 dts 规范为 {target} 生成随机 mock 数据，作为 Mokup 的响应 body。
输入规范：
{spec}

硬性要求：
1) 输出必须是合法 JSON（不允许注释、尾逗号或多余文本）。
2) 输出结构必须匹配 {target} 的类型定义。
3) 若是数组或 list，输出数组长度为 {count}。
4) 可选字段按 {optional_ratio} 的概率出现；nullable 字段按 {null_ratio} 的概率为 null。
5) 对枚举值随机选取；对常见格式（email/uuid/date-time/url/ipv4/ipv6）生成合理值。
6) 保持字段顺序与类型声明顺序一致。
7) 使用 {seed} 作为随机种子，确保相同输入能得到稳定结果。
8) 若类型中提供 JSDoc 示例或注释提示，优先参考但不要完全拷贝。

只输出 JSON。
```

### 兜底修复模板（当模型输出非 JSON 或结构不匹配时）

```text
你是一个 JSON 修复器。只输出修复后的 JSON，不要解释、不要 Markdown。

目标：把“当前输出”修复成符合 dts 中 {target} 的合法 JSON 响应 body。
输入规范：
{spec}

当前输出：
{broken_json}

修复要求：
1) 只输出合法 JSON。
2) 结构必须匹配 {target} 的类型定义。
3) 不要引入类型中不存在的字段。
4) 保持字段顺序与类型声明顺序一致。

只输出 JSON。
```

---

## 方案二：两步模板（先规范化 schema，再生成 JSON）

### 第一步：规范化 schema

```text
你是一个 schema 规范化工具。只输出 JSON，不要解释、不要 Markdown。

任务：将 dts 中的 {target} 规范化为一个简洁 JSON schema（只保留类型结构、必填、可空、枚举、format、范围信息）。
输入规范：
{spec}

输出格式要求：
{
  "type": "object|array|string|number|integer|boolean",
  "properties": { ... },
  "required": [ ... ],
  "nullable": true|false,
  "enum": [ ... ],
  "format": "email|uuid|date-time|url|ipv4|ipv6|...",
  "items": { ... },
  "min": number,
  "max": number
}

只输出 JSON。
```

### 第二步：从规范化 schema 生成响应 body

```text
你是一个严格的 JSON 生成器。只输出 JSON，不要解释、不要 Markdown。

任务：根据“规范化 schema”生成随机 mock 数据，作为 Mokup 的响应 body。
规范化 schema：
{normalized_schema}

生成规则：
1) 输出必须是合法 JSON。
2) 若 schema 为数组，长度为 {count}。
3) 可选字段按 {optional_ratio} 的概率出现；nullable 字段按 {null_ratio} 的概率为 null。
4) 对枚举值随机选取；对 format 生成合理值。
5) 使用 {seed} 作为随机种子，确保稳定输出。

只输出 JSON。
```

---

## 方案三：少量 few-shot 示例模板（稳定但更长）

### Few-shot（dts 模板）

```text
你是一个严格的 JSON 生成器。只输出 JSON，不要解释、不要 Markdown。

示例 1：
输入规范：
type User = {
  id: string
  name: string
  age?: number
  role: 'admin' | 'user'
}
目标：User
输出：
{"id":"user_9f3","name":"Li Wei","age":24,"role":"admin"}

示例 2：
输入规范：
type Paging<T> = {
  total: number
  items: T[]
}
type Product = { id: number; title: string; price: number }
目标：Paging<Product>
输出：
{"total":2,"items":[{"id":101,"title":"Canvas Bag","price":129},{"id":102,"title":"Desk Lamp","price":89}]}

现在开始处理：
任务：根据 dts 规范为 {target} 生成随机 mock 数据，作为 Mokup 的响应 body。
输入规范：
{spec}

硬性要求：
1) 输出必须是合法 JSON（不允许注释、尾逗号或多余文本）。
2) 输出结构必须匹配 {target} 的类型定义。
3) 若是数组或 list，输出数组长度为 {count}。
4) 可选字段按 {optional_ratio} 的概率出现；nullable 字段按 {null_ratio} 的概率为 null。
5) 对枚举值随机选取；对常见格式（email/uuid/date-time/url/ipv4/ipv6）生成合理值。
6) 使用 {seed} 作为随机种子，确保相同输入能得到稳定结果。

只输出 JSON。
```

---

## 使用建议

- dts：优先给出类型定义原文与目标类型名，避免歧义。
- 若结果 JSON 无法通过解析或类型校验，直接使用“兜底修复模板”。
