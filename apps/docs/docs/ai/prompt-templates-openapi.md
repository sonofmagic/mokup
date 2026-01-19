# OpenAPI Prompt Templates

These templates generate response bodies only. The output should be valid JSON that can be saved directly as `*.get.json`.

## Placeholders

- `{spec}`: Your OpenAPI source
- `{target}`: `{method} {path} {status} {contentType}`, for example `GET /users 200 application/json`
- `{count}`: Array length (for example, 10)
- `{seed}`: Random seed (string)
- `{locale}`: Locale for text fields (for example, `zh-CN` or `en-US`)
- `{optional_ratio}`: Probability for optional fields (0~1)
- `{null_ratio}`: Probability for nullable fields to be null (0~1)

---

## Approach 1: One-step + Repair (Recommended)

### Main generation template

```text
You are a strict JSON generator. Output JSON only. No explanations, no Markdown.

Task: Generate random mock data for {target} from the OpenAPI spec below, as a Mokup response body.
Input spec:
{spec}

Hard requirements:
1) Output must be valid JSON (no comments, no trailing commas, no extra text).
2) Output structure must match the response schema for {target}.
3) If the response is an array or list, output length must be {count}.
4) Optional fields appear with probability {optional_ratio}; nullable fields are null with probability {null_ratio}.
5) Pick enum values randomly; generate realistic values for formats (email/uuid/date-time/url/ipv4/ipv6).
6) Keep field order the same as the schema declaration order.
7) Use {seed} as the random seed for stable output.
8) Use {locale} for names, addresses, phone numbers, and free-text fields.
9) If schema includes example/default, prefer them but do not copy verbatim.

Output JSON only.
```

### Repair template (when output is invalid JSON or mismatched)

```text
You are a JSON repair tool. Output the fixed JSON only. No explanations, no Markdown.

Goal: Fix the "current output" so it becomes a valid JSON response body for {target} in the OpenAPI spec.
Input spec:
{spec}

Current output:
{broken_json}

Repair rules:
1) Output valid JSON only.
2) Structure must match the response schema for {target}.
3) Do not add fields that are not in the schema.
4) Keep field order the same as the schema declaration order.

Output JSON only.
```

---

## Approach 2: Two-step (Normalize schema, then generate JSON)

### Step 1: Normalize to a compact schema

```text
You are a schema normalization tool. Output JSON only. No explanations, no Markdown.

Task: Normalize {target} in the OpenAPI spec into a compact JSON schema that preserves structure, required/optional, nullable, enums, formats, and ranges.
Input spec:
{spec}

Output format:
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

Output JSON only.
```

### Step 2: Generate from normalized schema

```text
You are a strict JSON generator. Output JSON only. No explanations, no Markdown.

Task: Generate random mock data from the normalized schema as a Mokup response body.
Normalized schema:
{normalized_schema}

Rules:
1) Output must be valid JSON.
2) If schema is an array, length must be {count}.
3) Optional fields appear with probability {optional_ratio}; nullable fields are null with probability {null_ratio}.
4) Pick enum values randomly; generate realistic values for formats.
5) Use {seed} as the random seed for stable output.
6) Use {locale} for names, addresses, phone numbers, and free-text fields.

Output JSON only.
```

---

## Approach 3: Few-shot (Stable but longer)

### Few-shot template

```text
You are a strict JSON generator. Output JSON only. No explanations, no Markdown.

Example 1:
Input spec:
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
Target: GET /users 200 application/json
Output:
[{"id":101,"email":"sam@example.com"},{"id":102,"email":"ava@example.com"}]

Example 2:
Input spec:
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
Target: GET /orders/{id} 200 application/json
Output:
{"id":"d2a4f7b2-7ed8-4e1a-9fd5-0c1b8c8f8b6a","amount":129.5,"status":"paid"}

Now process:
Task: Generate random mock data for {target} from the OpenAPI spec below, as a Mokup response body.
Input spec:
{spec}

Hard requirements:
1) Output must be valid JSON (no comments, no trailing commas, no extra text).
2) Output structure must match the response schema for {target}.
3) If the response is an array or list, output length must be {count}.
4) Optional fields appear with probability {optional_ratio}; nullable fields are null with probability {null_ratio}.
5) Pick enum values randomly; generate realistic values for formats (email/uuid/date-time/url/ipv4/ipv6).
6) Use {seed} as the random seed for stable output.
7) Use {locale} for names, addresses, phone numbers, and free-text fields.

Output JSON only.
```

---

## Usage tips

- Always specify `{method} {path} {status} {contentType}` to disambiguate the response.
- If the result fails JSON parsing or schema validation, use the repair template immediately.
