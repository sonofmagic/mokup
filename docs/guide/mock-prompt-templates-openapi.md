# 从 OpenAPI 生成 Mokup 随机数据的提示词模板

这些模板面向“直接生成可写入 `*.get.json` 的响应 body”。你只需要把 `{...}` 占位符替换成真实内容即可。

## 占位符说明

- `{spec}`: 你的 OpenAPI 原文
- `{target}`: `{method} {path} {status} {contentType}`，例如 `GET /users 200 application/json`
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

任务：根据 OpenAPI 规范为 {target} 生成随机 mock 数据，作为 Mokup 的响应 body。
输入规范：
{spec}

硬性要求：
1) 输出必须是合法 JSON（不允许注释、尾逗号或多余文本）。
2) 输出结构必须匹配 {target} 的响应 schema。
3) 若是数组或 list，输出数组长度为 {count}。
4) 可选字段按 {optional_ratio} 的概率出现；nullable 字段按 {null_ratio} 的概率为 null。
5) 对枚举值随机选取；对 format（email/uuid/date-time/url/ipv4/ipv6）生成合理值。
6) 保持字段顺序与 schema 中的声明顺序一致。
7) 使用 {seed} 作为随机种子，确保相同输入能得到稳定结果。
8) 若 schema 中提供 example/default，优先参考但不要完全拷贝。

只输出 JSON。
```

### 兜底修复模板（当模型输出非 JSON 或结构不匹配时）

```text
你是一个 JSON 修复器。只输出修复后的 JSON，不要解释、不要 Markdown。

目标：把“当前输出”修复成符合 OpenAPI 中 {target} 的合法 JSON 响应 body。
输入规范：
{spec}

当前输出：
{broken_json}

修复要求：
1) 只输出合法 JSON。
2) 结构必须匹配 {target} 的响应 schema。
3) 不要引入 schema 中不存在的字段。
4) 保持字段顺序与 schema 中的声明顺序一致。

只输出 JSON。
```

---

## 方案二：两步模板（先规范化 schema，再生成 JSON）

### 第一步：规范化 schema

```text
你是一个 schema 规范化工具。只输出 JSON，不要解释、不要 Markdown。

任务：将 OpenAPI 中的 {target} 规范化为一个简洁 JSON schema（只保留类型结构、必填、可空、枚举、format、范围信息）。
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

### Few-shot（OpenAPI 模板）

```text
你是一个严格的 JSON 生成器。只输出 JSON，不要解释、不要 Markdown。

示例 1：
输入规范：
paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id: { type: integer }
                    email: { type: string, format: email }
                  required: [id, email]
目标：GET /users 200 application/json
输出：
[{"id":101,"email":"sam@example.com"},{"id":102,"email":"ava@example.com"}]

示例 2：
输入规范：
paths:
  /orders/{id}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  amount: { type: number }
                  status: { type: string, enum: [paid, pending] }
                required: [id, amount, status]
目标：GET /orders/{id} 200 application/json
输出：
{"id":"d2a4f7b2-7ed8-4e1a-9fd5-0c1b8c8f8b6a","amount":129.5,"status":"paid"}

现在开始处理：
任务：根据 OpenAPI 规范为 {target} 生成随机 mock 数据，作为 Mokup 的响应 body。
输入规范：
{spec}

硬性要求：
1) 输出必须是合法 JSON（不允许注释、尾逗号或多余文本）。
2) 输出结构必须匹配 {target} 的响应 schema。
3) 若是数组或 list，输出数组长度为 {count}。
4) 可选字段按 {optional_ratio} 的概率出现；nullable 字段按 {null_ratio} 的概率为 null。
5) 对枚举值随机选取；对 format（email/uuid/date-time/url/ipv4/ipv6）生成合理值。
6) 使用 {seed} 作为随机种子，确保相同输入能得到稳定结果。

只输出 JSON。
```

---

## 使用建议

- OpenAPI：尽量指定明确的 `{method} {path} {status} {contentType}`。
- 若结果 JSON 无法通过解析或类型校验，直接使用“兜底修复模板”。
