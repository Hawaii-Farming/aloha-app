import type { PlopTypes } from '@turbo/gen';
import { execSync } from 'node:child_process';

import { getPackageVersion } from '../../utils';

export function createPackageGenerator(plop: PlopTypes.NodePlopAPI) {
  plop.setGenerator('package', {
    description: 'Generate a new package for the Monorepo',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message:
          'What is the name of the package? (You can skip the `@aloha/` prefix)',
      },
      {
        type: 'input',
        name: 'deps',
        message:
          'Enter a space separated list of dependencies you would like to install',
      },
    ],
    actions: [
      (answers) => {
        if ('name' in answers && typeof answers.name === 'string') {
          if (answers.name.startsWith('@aloha/')) {
            answers.name = answers.name.replace('@aloha/', '');
          }
        }
        return 'Config sanitized';
      },
      {
        type: 'add',
        path: 'packages/{{ name }}/package.json',
        templateFile: 'templates/package/package.json.hbs',
      },
      {
        type: 'add',
        path: 'packages/{{ name }}/tsconfig.json',
        templateFile: 'templates/package/tsconfig.json.hbs',
      },
      {
        type: 'add',
        path: 'packages/{{ name }}/eslint.config.mjs',
        templateFile: 'templates/package/eslint.config.mjs.hbs',
      },
      {
        type: 'add',
        path: 'packages/{{ name }}/index.ts',
        template: "export * from './src';",
      },
      {
        type: 'add',
        path: 'packages/{{ name }}/src/index.ts',
        template: "export const name = '{{ name }}';",
      },
      {
        type: 'modify',
        path: 'packages/{{ name }}/package.json',
        async transform(content, answers) {
          const pkg = JSON.parse(content);

          for (const dep of answers.deps.split(' ').filter(Boolean)) {
            const version = await getPackageVersion(dep);

            pkg.dependencies![dep] = `^${version}`;
          }
          return JSON.stringify(pkg, null, 2);
        },
      },
      async () => {
        /**
         * Install deps and format everything
         */
        execSync('pnpm i', {
          stdio: 'inherit',
        });

        execSync(`pnpm run format:fix`);

        return 'Package scaffolded';
      },
    ],
  });
}
