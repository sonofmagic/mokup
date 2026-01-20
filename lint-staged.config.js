export default {
  '*.{js,jsx,mjs,ts,tsx,mts,vue}': [
    'eslint --fix --no-warn-ignored',
  ],
  '*.{json,md,mdx,css,html,yml,yaml,scss}': [
    // 'prettier --with-node-modules --ignore-path .prettierignore --write',
    'eslint --fix --no-warn-ignored',
  ],
  // for rust
  // '*.rs': ['cargo fmt --'],
}
