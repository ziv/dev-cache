import { existsSync } from 'node:fs';

export function exists(path: string) {
    return existsSync(path);
}
