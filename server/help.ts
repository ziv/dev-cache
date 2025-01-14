import { gray, green, yellow } from "@std/fmt/colors";

export default `
dev-cache

Local encrypted in-memory cache server.
For more information, visit: https://discoverorg.atlassian.net/wiki/x/kQCc7y4

${yellow("Usage:")} 
tmp-cache [options]
  
${yellow("Options:")}
    ${green("-h, --help")}                           Show this help message
    ${green("-t, --ttl <seconds>")}                  Time to live in seconds ${gray("[default: 3600]")}
    ${green("-s, --cache-key-strategy <strategy>")}  Cache key strategy ${gray("[default: watch]")}

${yellow("Cache Key Strategy:")}
How the cache key is generated.
${green("none")}  - identify cache only by its name
${green("appid")} - identify cache by appid and name, useful for multiple apps, default strategy
${green("watch")} - identify cache by appid, name, and parent pid, useful for watching a process

${yellow("Environment variables:")}
    DEV_CACHE_SSL_KEY_PATH
    DEV_CACHE_SSL_CERT_PATH
    # todo complete
`;
