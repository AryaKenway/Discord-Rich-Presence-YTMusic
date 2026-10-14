##### YouTube Music Discord RPC

##### Overview

##### 

##### This project syncs your YouTube Music playback directly to your Discord status through a Node.js bridge and a Firefox browser extension.

##### Core Features

##### 

##### The system performs live synchronization of song titles and artist names. Discord's activity timestamps provide an elapsed/total timer and progress bar while music plays. The activity is cleared while music is paused to prevent Discord from displaying its own elapsed activity timer, then restored when playback resumes. The YouTube Music logo is used as the activity image; dynamic song covers are not reliably supported by Discord Rich Presence.

##### Node.js Setup

##### 

##### Begin by cloning the repository to your local machine. Open a terminal window inside the /server directory. Execute the npm install command to download the necessary dependencies. Launch the bridge by running node server.js.





##### Firefox Installation

##### 

##### Navigate to the about:debugging page in your browser. Click on the This Firefox option in the sidebar. Select the Load Temporary Add-on button and choose the manifest.json file from your project folder.


##### Requirements

##### 

##### The latest Node.js LTS version is required for the server. The Discord Desktop application must be running on your system. You must also have the Activity Status setting enabled within your Discord user profile.





![Demo Image](GithubImages/DemoImage.png)
