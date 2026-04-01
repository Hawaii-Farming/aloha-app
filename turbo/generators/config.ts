import type { PlopTypes } from '@turbo/gen';

import { createDockerGenerator } from './templates/docker/generator';
import { createEnvironmentVariablesGenerator } from './templates/env/generator';
import { createPackageGenerator } from './templates/package/generator';
import { createEnvironmentVariablesValidatorGenerator } from './templates/validate-env/generator';

const generators = [
  createPackageGenerator,
  createEnvironmentVariablesGenerator,
  createEnvironmentVariablesValidatorGenerator,
  createDockerGenerator,
];

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  generators.forEach((gen) => gen(plop));
}
