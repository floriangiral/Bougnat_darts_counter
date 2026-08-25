import fs from 'node:fs';

const sonarConfigPath = 'sonar-project.properties';
const governanceSpecPath = 'specs/029-counter-sonar-coverage-governance/spec.md';
const protectedPrefixes = ['src/domain/', 'src/application/', 'utils/', 'lib/', 'functions/'];

const readFile = (path) => fs.readFileSync(path, 'utf8');

const parseProperty = (content, propertyName) => {
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${propertyName}=`));

  if (!line) {
    throw new Error(`Missing ${propertyName} in ${sonarConfigPath}`);
  }

  return line.slice(propertyName.length + 1).split(',').map((value) => value.trim()).filter(Boolean);
};

const sonarConfig = readFile(sonarConfigPath);
const governanceSpec = readFile(governanceSpecPath);
const exclusions = parseProperty(sonarConfig, 'sonar.coverage.exclusions');
const protectedExclusions = exclusions.filter((pattern) => protectedPrefixes.some((prefix) => pattern.startsWith(prefix)));
const undocumentedExclusions = exclusions.filter((pattern) => !governanceSpec.includes(`\`${pattern}\``));

if (protectedExclusions.length > 0) {
  throw new Error(`Protected code cannot be excluded from coverage: ${protectedExclusions.join(', ')}`);
}

if (undocumentedExclusions.length > 0) {
  throw new Error(`Coverage exclusions must be approved in ${governanceSpecPath}: ${undocumentedExclusions.join(', ')}`);
}

console.log(`Sonar coverage governance passed: ${exclusions.length} approved UI exclusion(s).`);
