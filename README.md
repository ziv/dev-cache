# Dev-Cache

Development oriented local temporary cache for storing sensitive data.

## About

### Problem Statement

Loading sensitive data during the application bootstrap is a time-consuming process that can slow down the development.

We want:

1. allow developers to store sensitive data that loaded during the application bootstrap between reloading sessions.
2. the data to be automatically deleted after a certain time (TTL).
3. the data be accessible only from the local machine only.
4. the data to be stored encrypted in memory.

We do not want to:

1. store sensitive data in a persistent storage.
   Persistent means authentication and makes the cache mechanisms obsolete since we still need to load its credentials.
2. allow caching sensitive data on the file system. Deleted files leave traces on the disk.

### Encrypted is not Secure!

The data is encrypted to avoid memory dump.
The `dev-cache` solution is **not providing a secure way** to access the sensitive data; it only **reduces the risk** of
caching it locally.
Like any other solution, any process with enough privileges (`root`) can access anything in the machine.

### Proposed Solution

A simple server that stores and retrieves sensitive encrypted data in memory leaving zero footprints on the disk.
The server should be accessible only from the local machine using ~~HTTP over TLS~~ unix socket.

The `dev-cache` will provide a library to interact with the server and store the sensitive data.

--- 

## Installation

Clone this repository, and run the installation script:

```shell
./install.sh
```

\*For more information, see the [manual installation guide](#manual-installation-guide).

## Usage

Starting dev-cache server:

```shell
./dev-cache [options]
```

### Options

| Option       | Description                          | Default |
|--------------|--------------------------------------|---------|
| `--help`     | Show help message                    |         |
| `--ttl`      | Set the data TTL (in seconds)        | `3600`  |
| `--strategy` | Set the caching strategy (see below) | `appid` |

### Caching Strategies

The data is kept in memory and identified by a key. There are several strategies to identify the cache:

* `none` identify cache only by its name.
* `appid` identify cache by appid and name, useful for multiple apps, **default** strategy.
* `watch` identify cache by appid, name, and parent process id, useful for watching a process.

## Integration

To use the `dev-cache` in your project, you need to install the library:

```shell
npm i @zoominfo/dev-cache-client;
```

Use the exported functions to interact with the server.
When not in development mode or the cache server is not available, the library will act only as a pipe.

Example:

```typescript
import wrap from '@zoominfo/dev-cache-client';

async function veryExpensiveFunction() {
    // Some very expensive operation
}

const value = await wrap(() => veryExpensiveFunction());
```

---

## Appendix

### Manual Installation Guide

[TBC]