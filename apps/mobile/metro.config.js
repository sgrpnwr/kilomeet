const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (so changes in shared packages are picked up)
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve packages from both the app's own node_modules
//    AND the root node_modules (this is where hoisted packages live)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force these specific packages to ALWAYS resolve from the app's own
//    node_modules, never the hoisted root copy — this is what actually
//    fixes "Invalid hook call" caused by duplicate React instances.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// 4. Prevents Metro from walking UP the folder tree past this app
//    when resolving modules, avoiding accidental pickup of a second copy
// config.resolver.disableHierarchicalLookup = true;

module.exports = config;