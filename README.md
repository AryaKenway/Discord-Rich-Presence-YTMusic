##### YouTube Music Discord RPC

##### Overview

##### 

##### This project syncs your YouTube Music playback directly to your Discord status through a Node.js bridge and a Firefox browser extension.

##### Core Features

##### 

##### The system performs live synchronization of song titles, artist names, and high-resolution album artwork. Clicking the song title in Discord opens the current song on YouTube Music. Discord's activity timestamps provide an elapsed/total timer and progress bar while music plays. The album cover is shown as the large activity image with the YouTube Music logo overlaid as the small image. If artwork is unavailable or Discord cannot use its external URL, the YouTube Music logo is used as the large image. The activity is cleared while music is paused to prevent Discord from displaying its own elapsed activity timer, then restored when playback resumes.

##### Node.js Setup

##### 

For development, install Node.js, run `npm install` from the repository root, and start the bridge with `node server.js`.





##### Firefox Installation

##### 

##### Navigate to the about:debugging page in your browser. Click on the This Firefox option in the sidebar. Select the Load Temporary Add-on button and choose the manifest.json file from your project folder.

For Mozilla Add-ons submissions, upload `ytm-extension/ytm-extension.zip` from the Developer Hub. The ZIP contains only `manifest.json` and `content.js` at its root. The extension reads playback metadata on YouTube Music and sends it to the local bridge at `http://localhost:3000`; it does not include telemetry or send data to the project maintainer. The bridge and Discord Desktop are separate requirements and are not included in the add-on.


##### Windows Installer

##### 

The Windows installer bundles the bridge, its production dependencies, and Node.js; users do not need to install Node.js or run npm. Discord Desktop and the Firefox add-on are still required and installed separately. The bridge retries its Discord connection if Discord is still starting.

To build the installer from source on 64-bit Windows, install Node.js 24 and Inno Setup 6, then run `npm run build:installer`. The setup executable is written to the `dist` folder. The GitHub Actions workflow also builds the installer when manually run or when a `bridge-v*` tag is pushed; download its artifact from the workflow run. The build creates a clean staging package and installs production dependencies using the committed lockfile. It uses `npm install` rather than `npm ci` because `discord-rpc`'s optional GitHub dependency (`register-scheme`) has incomplete version metadata in the lockfile, which causes `npm ci` to reject the tree. Optional dependencies are omitted because `register-scheme` is only needed when running inside Electron; the Node.js bridge does not use it. npm uses its nested install strategy to avoid a deduplication error caused by this optional Git dependency.

The installer can launch the bridge when setup finishes, adds a Start Menu shortcut and uninstaller, and lets users optionally enable automatic startup at Windows sign-in. The Firefox extension is not included.


##### Requirements

##### 

Discord Desktop must be installed and running, and Activity Status must be enabled in Discord. Node.js is needed only to run the bridge from source or build the installer; it is bundled in the installer.





![Demo Image](GithubImages/DemoImage.png)
