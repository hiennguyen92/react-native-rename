#!/usr/bin/env node

// nS - No Space
// lC - Lowercase

import cheerio from 'cheerio';
import colors from 'colors';
import fs from 'fs';
import program from 'commander';
import replace from 'node-replace';
import shell from 'shelljs';
import pjson from '../package.json';
import path from 'path';
import { foldersAndFiles } from './config/foldersAndFiles';
import { filesToModifyContent } from './config/filesToModifyContent';
import { bundleIdentifiers } from './config/bundleIdentifiers';

const devTestRNProject = ''; // For Development eg '/Users/junedomingo/Desktop/RN49'
const __dirname = devTestRNProject || process.cwd();
const projectName = pjson.name;
const replaceOptions = {
  recursive: true,
  silent: true,
};

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

function replaceContent(regex, replacement, paths) {
  replace({
    regex,
    replacement,
    paths,
    ...replaceOptions,
  });

  for (const filePath of paths) {
    console.log(`${filePath.replace(__dirname, '')} ${colors.green('MODIFIED')}`);
  }
}

const deletePreviousBundleDirectory = ({ oldBundleNameDir, shouldDelete }) => {
  if (shouldDelete) {
    const dir = oldBundleNameDir.replace(/\./g, '/');
    const deleteDirectory = shell.rm('-rf', dir);
    Promise.resolve(deleteDirectory);
    console.log('Done removing previous bundle directory.'.green);
  } else {
    Promise.resolve();
    console.log('Bundle directory was not changed. Keeping...'.yellow);
  }
};

const cleanBuilds = () => {
  const deleteDirectories = shell.rm('-rf', [
    path.join(__dirname, 'ios/build/*'),
    path.join(__dirname, 'android/.gradle/*'),
    path.join(__dirname, 'android/app/build/*'),
    path.join(__dirname, 'android/build/*'),
  ]);
  Promise.resolve(deleteDirectories);
  console.log('Done removing builds.'.green);
};

readFile(path.join(__dirname, 'android/app/src/main/res/values/strings.xml'))
  .then(data => {
    const $ = cheerio.load(data);
    const currentAppName = $('string[name=app_name]').text();
    const nS_CurrentAppName = currentAppName.replace(/\s/g, '');
    const lC_Ns_CurrentAppName = nS_CurrentAppName.toLowerCase();

    program
      .version('2.4.1')
      .arguments('<newName>')
      .option('-b, --bundleID [value]', 'Set custom bundle identifier eg. "com.junedomingo.travelapp"')
      .option('-f, --files [value]', 'set files replace eg. [{ "from" : "path", "to": "path" }]')
      .action(newName => {
        const nS_NewName = newName.replace(/\s/g, '');
        const pattern = /^([\p{Letter}\p{Number}])+([\p{Letter}\p{Number}\s]+)$/u;
        const lC_Ns_NewAppName = nS_NewName.toLowerCase();
        const bundleID = program.bundleID ? program.bundleID.toLowerCase() : null;
        const files = program.files ? program.files : null;
        let newBundlePath;
        const listOfFoldersAndFiles = JSON.parse(files)
        const listOfFilesToModifyContent = filesToModifyContent(currentAppName, newName, projectName);

        if (bundleID) {
          newBundlePath = bundleID.replace(/\./g, '/');
          const id = bundleID.split('.');
          if (id.length < 2)
            return console.log(
              'Invalid Bundle Identifier. Add something like "com.travelapp" or "com.junedomingo.travelapp"'
            );
        }

        if (!pattern.test(newName)) {
          return console.log(
            `"${newName}" is not a valid name for a project. Please use a valid identifier name (alphanumeric and space).`
          );
        }

        if (newName === currentAppName || newName === nS_CurrentAppName || newName === lC_Ns_CurrentAppName) {
          return console.log('Please try a different name.');
        }

        const resolveFoldersAndFiles = new Promise(resolve => {
          if (listOfFoldersAndFiles) {
            listOfFoldersAndFiles.forEach((element, index) => {
              const dest = `${element['to']}`;
              const source = `${element['from']}`;
              let itemsProcessed = 1;
              const successMsg = `/${dest} ${colors.green('REPLACED')}`;

              setTimeout(() => {
                itemsProcessed += index;
                console.log(source);
                if (fs.existsSync(path.join(__dirname, source)) || !fs.existsSync(path.join(__dirname, source))) {
                  shell.exec(`git rm -r "${path.join(__dirname, dest)}"`)
                  const move = shell.exec(
                    `git mv "${path.join(__dirname, source)}" "${path.join(__dirname, dest)}" 2>/dev/null`
                  );

                  if (move.code === 0) {
                    console.log(successMsg);
                  } else if (move.code === 128) {
                    // if "outside repository" error occured
                    if (shell.mv('-f', path.join(__dirname, source), path.join(__dirname, dest)).code === 0) {
                      console.log(successMsg);
                    } else {
                      console.log("Ignore above error if this file doesn't exist");
                    }
                  }
                }

                if (itemsProcessed === listOfFoldersAndFiles.length) {
                  resolve();
                }
              }, 200 * index);
            });
          }else{
            resolve();
          }
        });

        // Modify file content from ./config/filesToModifyContent.js
        const resolveFilesToModifyContent = () =>
          new Promise(resolve => {
            let filePathsCount = 0;
            let itemsProcessed = 0;
            listOfFilesToModifyContent.map(file => {
              filePathsCount += file.paths.length;

              file.paths.map((filePath, index) => {
                const newPaths = [];

                setTimeout(() => {
                  itemsProcessed++;
                  if (fs.existsSync(path.join(__dirname, filePath))) {
                    newPaths.push(path.join(__dirname, filePath));
                    replaceContent(file.regex, file.replacement, newPaths);
                  }
                  if (itemsProcessed === filePathsCount) {
                    resolve();
                  }
                }, 200 * index);
              });
            });
          });

        const resolveJavaFiles = () =>
          new Promise(resolve => {
            readFile(path.join(__dirname, 'android/app/src/main/AndroidManifest.xml')).then(data => {
              const $ = cheerio.load(data);
              const currentBundleID = $('manifest').attr('package');
              const newBundleID = program.bundleID ? bundleID : `com.${lC_Ns_NewAppName}`;
              const javaFileBase = '/android/app/src/main/java';
              const newJavaPath = `${javaFileBase}/${newBundleID.replace(/\./g, '/')}`;
              const currentJavaPath = `${javaFileBase}/${currentBundleID.replace(/\./g, '/')}`;

              if (bundleID) {
                newBundlePath = newJavaPath;
              } else {
                newBundlePath = newBundleID.replace(/\./g, '/').toLowerCase();
                newBundlePath = `${javaFileBase}/${newBundlePath}`;
              }

              const fullCurrentBundlePath = path.join(__dirname, currentJavaPath);
              const fullNewBundlePath = path.join(__dirname, newBundlePath);

              // Create new bundle folder if doesn't exist yet
              if (!fs.existsSync(fullNewBundlePath)) {
                shell.mkdir('-p', fullNewBundlePath);
                const move = shell.exec(`git mv "${fullCurrentBundlePath}/"* "${fullNewBundlePath}" 2>/dev/null`);
                const successMsg = `${newBundlePath} ${colors.green('BUNDLE INDENTIFIER CHANGED')}`;

                if (move.code === 0) {
                  console.log(successMsg);
                } else if (move.code === 128) {
                  // if "outside repository" error occured
                  if (shell.mv('-f', fullCurrentBundlePath + '/*', fullNewBundlePath).code === 0) {
                    console.log(successMsg);
                  } else {
                    console.log(`Error moving: "${currentJavaPath}" "${newBundlePath}"`);
                  }
                }
              }

              const vars = {
                currentBundleID,
                newBundleID,
                newBundlePath,
                javaFileBase,
                currentJavaPath,
                newJavaPath,
              };
              resolve(vars);
            });
          });

        const resolveBundleIdentifiers = params =>
          new Promise(resolve => {
            let filePathsCount = 0;
            const { currentBundleID, newBundleID, newBundlePath, javaFileBase, currentJavaPath, newJavaPath } = params;

            bundleIdentifiers(
              currentAppName,
              newName,
              projectName,
              currentBundleID,
              newBundleID,
              newBundlePath
            ).map(file => {
              filePathsCount += file.paths.length - 1;
              let itemsProcessed = 0;

              file.paths.map((filePath, index) => {
                const newPaths = [];
                if (fs.existsSync(path.join(__dirname, filePath))) {
                  newPaths.push(path.join(__dirname, filePath));

                  setTimeout(() => {
                    itemsProcessed += index;
                    replaceContent(file.regex, file.replacement, newPaths);
                    if (itemsProcessed === filePathsCount) {
                      const oldBundleNameDir = path.join(__dirname, javaFileBase, currentBundleID);
                      resolve({ oldBundleNameDir, shouldDelete: currentJavaPath !== newJavaPath });
                    }
                  }, 200 * index);
                }
              });
            });
          });

        const rename = () => {
          resolveFoldersAndFiles
            .then(resolveFilesToModifyContent)
            .then(resolveJavaFiles)
            .then(resolveBundleIdentifiers)
            .then(deletePreviousBundleDirectory)
            .then(cleanBuilds)
            .then(() => console.log(`APP SUCCESSFULLY RENAMED TO "${newName}"! 🎉 🎉 🎉`.green))
            .then(() => {
              if (fs.existsSync(path.join(__dirname, 'ios', 'Podfile'))) {
                console.log(
                  `${colors.yellow('Podfile has been modified, please run "pod install" inside ios directory.')}`
                );
              }
            })
            .then(() =>
              console.log(
                `${colors.yellow(
                  'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" before running the app. '
                )}`
              )
            );
        };

        rename();
      })
      .parse(process.argv);
    if (!process.argv.slice(2).length) program.outputHelp();
  })
  .catch(err => {
    if (err.code === 'ENOENT') return console.log('Directory should be created using "react-native init"');

    return console.log('Something went wrong: ', err);
  });
