import process from 'node:process';

export default function appid(value: string) {
    return process.env.DEVCACHE_APPID ?? value;
}
