# llms.txt

`llms.txt` is a lightweight, LLM-friendly index of this documentation. It helps
tools discover key pages and terms without you pasting the entire site.

## Where it lives

This site publishes two LLM-friendly files during the VitePress build:

- https://mokup.icebreaker.top/llms.txt
- https://mokup.icebreaker.top/llms-full.txt

## How to use it

- Paste the URL into your LLM and ask it to read it before answering.
- Use it alongside the AI Prompts pages for response generation workflows.

## llms-full.txt

`/llms-full.txt` bundles the full documentation into a single file. Use it when
you want the model to search the entire docs set.

## Example prompts

```text
Read https://mokup.icebreaker.top/llms.txt and list the best pages to learn
Cloudflare deployment for Mokup.
```

```text
Use https://mokup.icebreaker.top/llms-full.txt as context and explain how to
create a Worker entry with mokup/server/worker.
```

## When it updates

The file is regenerated on each docs build. Update the docs, rebuild, and the
`llms.txt` content stays in sync.

## Related

- [AI Prompts](./)
