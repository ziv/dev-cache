# @zoominfo/dev-cache-client

This is a Node.js client for the DevCache service.

## Installation

```sh
npm install @zoominfo/dev-cache-client
```

## Usage

* In **none** development environments, the `wrap` function is only a pipe for the provided function.
* In a `development` environment, the `wrap` will cache the generator results.

```typescript
import wrap from '@zoominfo/dev-cache-client';

async function veryExpensiveFunction() {
    // Some very expensive operation
}

const value = await wrap(() => veryExpensiveFunction());
```

