# AI 提示词

本章节提供从 DTS 或 OpenAPI 生成 Mokup 响应 body 的提示词模板，输出为纯 JSON，可直接保存为 `*.get.json`。

## 最佳实践

- 明确指定目标类型或 `{method} {path} {status} {contentType}`。
- 数组场景设置 `{count}`，并固定 `{seed}` 以保证可复现。
- 输出 JSON 不合法或结构不匹配时，直接使用修复模板。
- 只生成响应 body，不要输出 Mokup 规则对象。

## 模板

- [DTS 提示词模板](./prompt-templates-dts)
- [OpenAPI 提示词模板](./prompt-templates-openapi)
- [llms.txt](./llms-txt)
