# DTS Prompt Templates

These templates generate response bodies only. The output should be valid JSON that can be saved directly as `*.get.json`.

## Placeholders

- `{spec}`: Your DTS source
- `{target}`: `TypeName` or a type alias description
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

Task: Generate random mock data for {target} from the DTS spec below, as a Mokup response body.
Input spec:
{spec}

Hard requirements:
1) Output must be valid JSON (no comments, no trailing commas, no extra text).
2) Output structure must match the {target} type definition.
3) If the target is an array or list, output length must be {count}.
4) Optional fields appear with probability {optional_ratio}; nullable fields are null with probability {null_ratio}.
5) Pick enum values randomly; generate realistic values for common formats (email/uuid/date-time/url/ipv4/ipv6).
6) Keep field order the same as the type declaration order.
7) Use {seed} as the random seed for stable output.
8) Use {locale} for names, addresses, phone numbers, and free-text fields.
9) If JSDoc examples or hints exist, prefer them but do not copy verbatim.

Output JSON only.
```

### Repair template (when output is invalid JSON or mismatched)

```text
You are a JSON repair tool. Output the fixed JSON only. No explanations, no Markdown.

Goal: Fix the "current output" so it becomes a valid JSON response body for {target} in the DTS spec.
Input spec:
{spec}

Current output:
{broken_json}

Repair rules:
1) Output valid JSON only.
2) Structure must match the {target} type definition.
3) Do not add fields that are not in the type.
4) Keep field order the same as the type declaration order.

Output JSON only.
```

---

## Approach 2: Two-step (Normalize schema, then generate JSON)

### Step 1: Normalize to a compact schema

```text
You are a schema normalization tool. Output JSON only. No explanations, no Markdown.

Task: Normalize {target} in the DTS spec into a compact JSON schema that preserves structure, required/optional, nullable, enums, formats, and ranges.
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
type User = {
  id: string
  name: string
  age?: number
  role: 'admin' | 'user'
}
Target: User
Output:
{"id":"user_9f3","name":"Li Wei","age":24,"role":"admin"}

Example 2:
Input spec:
type Paging<T> = {
  total: number
  items: T[]
}
type Product = { id: number; title: string; price: number }
Target: Paging<Product>
Output:
{"total":2,"items":[{"id":101,"title":"Canvas Bag","price":129},{"id":102,"title":"Desk Lamp","price":89}]}

Now process:
Task: Generate random mock data for {target} from the DTS spec below, as a Mokup response body.
Input spec:
{spec}

Hard requirements:
1) Output must be valid JSON (no comments, no trailing commas, no extra text).
2) Output structure must match the {target} type definition.
3) If the target is an array or list, output length must be {count}.
4) Optional fields appear with probability {optional_ratio}; nullable fields are null with probability {null_ratio}.
5) Pick enum values randomly; generate realistic values for common formats (email/uuid/date-time/url/ipv4/ipv6).
6) Use {seed} as the random seed for stable output.
7) Use {locale} for names, addresses, phone numbers, and free-text fields.

Output JSON only.
```

---

## Usage tips

- Provide the full type definitions around `{target}` to avoid ambiguity.
- If the result fails JSON parsing or type validation, use the repair template immediately.
