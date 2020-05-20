// nS - No Space
// lC - Lowercase

export function filesToModifyContent(currentAppName, newName, publisherId, colors) {
  const nS_CurrentAppName = currentAppName.replace(/\s/g, '');
  const nS_NewName = newName.replace(/\s/g, '');

  return [
    {
      regex: `<string name="app_name">${currentAppName}</string>`,
      replacement: `<string name="app_name">${newName}</string>`,
      paths: ['android/app/src/main/res/values/strings.xml'],
    },
    {
      regex: nS_CurrentAppName,
      replacement: nS_NewName,
      paths: [
        'index.js',
        'index.android.js',
        'index.ios.js',
        `ios/${nS_NewName}.xcodeproj/project.pbxproj`,
        `ios/${nS_NewName}.xcworkspace/contents.xcworkspacedata`,
        `ios/${nS_NewName}.xcodeproj/xcshareddata/xcschemes/${nS_NewName}-tvOS.xcscheme`,
        `ios/${nS_NewName}.xcodeproj/xcshareddata/xcschemes/${nS_NewName}.xcscheme`,
        `ios/${nS_NewName}/AppDelegate.m`,
        'android/settings.gradle',
        `ios/${nS_NewName}Tests/${nS_NewName}Tests.m`,
        'ios/build/info.plist',
        'ios/Podfile',
        'app.json',
      ],
    },
    {
      regex: `text="${currentAppName}"`,
      replacement: `text="${newName}"`,
      paths: [`ios/${nS_NewName}/Base.lproj/LaunchScreen.xib`],
    },
    {
      regex: currentAppName,
      replacement: newName,
      paths: [`ios/${nS_NewName}/Info.plist`],
    },
    {
      regex: `"name": "${nS_CurrentAppName}"`,
      replacement: `"name": "${nS_NewName}"`,
      paths: ['package.json'],
    },
    {
      regex: `"displayName": "${currentAppName}"`,
      replacement: `"displayName": "${newName}"`,
      paths: ['app.json'],
    },
    {
      //Remove Onboarding
      regex: `initialRouteName: 'Onboarding'`,
      replacement: `initialRouteName: 'Login'`,
      paths: ['src/navigators-v2/index.js']
    },
    {
      //Color Theme 1
      regex: `mainOrange: '#f76b1c'`,
      replacement: `mainOrange: '${colors['mainOrange']}'`,
      paths: ['src/theme.js']
    },
    {
      //Color Theme 2
      regex: `mainOrangeDarker: '#F73E1C'`,
      replacement: `mainOrangeDarker: '${colors['mainOrangeDarker']}'`,
      paths: ['src/theme.js']
    },
    {
      //Color Theme 3
      regex: `mainOrangeLighter: '#FF8D1A'`,
      replacement: `mainOrangeLighter: '${colors['mainOrangeLighter']}'`,
      paths: ['src/theme.js']
    },
    {
      //Color Theme 4
      regex: `mainBlueError: '#7C6CF5'`,
      replacement: `mainBlueError: '${colors['mainBlueError']}'`,
      paths: ['src/theme.js']
    },
    {
      //Splash Screen Color
      regex: `#f88822`,
      replacement: `${colors['mainOrange']}`,
      paths: ['android/app/src/main/res/values/colors.xml']
    },
    {
      //Search content
      regex: `Search Soundwise`,
      replacement: `Search ${newName}`,
      paths: ['src/screens-v2/Main/Discover.js']
    },
    {
      //Welcome content
      regex: `Welcome to Soundwise`,
      replacement: `Welcome to ${newName}`,
      paths: ['src/screens-v2/Auth/index.js']
    },
    {
      //replace config
      regex: `PUBLISHER_ID: '1503002103690p'`,
      replacement: `PUBLISHER_ID: '${publisherId}'`,
      paths: ['src/white-label-config.js']
    }
  ];
}
