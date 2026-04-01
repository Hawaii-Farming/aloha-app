import { readFileSync } from 'node:fs';

export function getPackageVersion(dep: string) {
  return fetch(
    `https://registry.npmjs.org/-/package/${dep}/dist-tags`
  )
    .then((res) => res.json())
    .then((json) => json.latest);
}

export namespace generator {
  export function loadAllEnvironmentVariables(basePath: string) {
    const sharedEnv = loadEnvironmentVariables(basePath + '/.env');
    const productionEnv = loadEnvironmentVariables(
      basePath + '/.env.production'
    );

    return {
      ...sharedEnv,
      ...productionEnv
    };
  }

  export function loadEnvironmentVariables(filePath: string) {
    const file = readFileSync(filePath, 'utf-8');
    const vars = file.split('\n').filter((line) => line.trim() !== '');

    const env: Record<string, string> = {};

    for (const line of vars) {
      const isComment = line.startsWith('#');

      if (isComment) {
        continue;
      }

      const [key, value] = line.split('=');

      if (!key) {
        continue;
      }

      env[key] = value ?? '';
    }

    return env;
  }
}
