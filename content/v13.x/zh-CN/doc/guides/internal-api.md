These flags are for Node.js core development usage only. Do not use these flags in your own applications. These flags are not subjected to semantic versioning rules. The core developers may remove these flags in any version of Node.js.

# Internal documentation of Node.js

## CLI

### 标记

#### `--inspect-brk-node[=[host:]port]`


<!-- YAML
added: v7.6.0
-->

Activate inspector on `host:port` and break at start of the first internal JavaScript script executed when the inspector is available. 默认的 `主机:端口` 是 `127.0.0.1:9229`。
