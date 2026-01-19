# AI Prompting

Use these prompt templates to generate Mokup response bodies from DTS or OpenAPI specs. They are designed to return JSON only so the output can be saved directly as `*.get.json`.

## Best practices

- Always specify the exact target type or `{method} {path} {status} {contentType}`.
- Set `{count}` for arrays and keep `{seed}` stable to get reproducible results.
- If the model returns invalid JSON or mismatched structure, run the repair prompt.
- Keep outputs as response bodies only (not full Mokup rule objects).

## Templates

- [DTS prompt templates](./prompt-templates-dts)
- [OpenAPI prompt templates](./prompt-templates-openapi)
