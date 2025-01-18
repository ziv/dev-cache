# @xpr/devcache

Node.js client for the [DevCache](https://github.com/ziv/dev-cache) service.

## Installation

```bash
npm install @xpr/devcache
```

## Usage

```ts
import wrap from '@xpr/devcache';

function expensiveOperation() {
    // Do something expensive
}

const cache = wrap('app', 'name', () => expensiveOperation());
```
