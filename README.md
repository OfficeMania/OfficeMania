```
   ____   __  __ _          __  __             _       
  / __ \ / _|/ _(_)        |  \/  |           (_)      
 | |  | | |_| |_ _  ___ ___| \  / | __ _ _ __  _  __ _ 
 | |  | |  _|  _| |/ __/ _ \ |\/| |/ _` | '_ \| |/ _` |
 | |__| | | | | | | (_|  __/ |  | | (_| | | | | | (_| |
  \____/|_| |_| |_|\___\___|_|  |_|\__,_|_| |_|_|\__,_|
```

Welcome to the **OfficeMania** project!

## Description

OfficeMania is an interactive open-source meeting soloution made for you! Talk to people just as in real life, hold private meetings with interactive elements and play some pong; nearly everything is possible.

In the following you can find a summary of all dependencies we used.

[TypeScript](https://www.typescriptlang.org/) is used as the programming language both client- and server-wide. The server is based on [Node.js](https://nodejs.org/en/) (with [Express.js](https://expressjs.com/de/)) and the client scripts are generated using [webpack](https://webpack.js.org/); source code can be shared between client and server (src/common) so that, for example, client- and server-validations don't have to be written twice. Since OfficeManis is a game-like application, an [authorative server](https://www.gabrielgambetta.com/client-server-game-architecture.html) needs to synchronize its state with the clients. This communication is done using [Colyseus](https://www.colyseus.io/). Lastly, [Jest](https://jestjs.io/) can be used for testing. All dependencies are managed using [npm](https://www.npmjs.com/). The videochat is handled through [jit.si](https://www.jitsi.org/).

## Installation in WSL (Windows Subsystem for Linux) with VSCode and git over HTTPS (no VPN necessary)

**TL;TR**

- Install Nodejs and typescript in WSL.

  ```
  $ curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  $ sudo apt install -y nodejs
  $ npm install typescript --save-dev
  ```
- Clone OfficeMania into a location in the Linux filesystem using your y-Number and an access token.

  ```
  $ cd ~
  $ git config --global credential.helper store
  $ git config --global user.name "Your Name"
  $ git config --global user.email "y.name@tu-braunschweig.de"
  $ git clone https://git.rz.tu-bs.de/systemsicherheit/teamprojekt/officemania.git
  ```

- Get the "Remote - WSL"-Extension for VSCode. In the project folder run:

  ```
  $ npm install
  $ npm start
  ```
 
- Done!


**Detailed version**


Set up WSL in Windows 10 version 2004 and higher (Build 19041 and higher) or Windows 11:

Search for PowerShell and start it as Administrator by right-clicking it. To install WSL, type:

```
$ wsl --install
```

Go to the Microsoft Store and install "Ubuntu". Restart your Computer.
Then open Ubuntu and set it up following the given instructions.

Create an access token in the GitLab web interface under Profile > Edit Profile > Access Tokens. Copy it and store it safely, because it will only be shown once.

Open the Ubuntu app and clone the OfficeMania git repository via HTTPS into a location in the Linux filesystem. To get there, go to ~ and create a folder.

```
$ cd ~
$ git config --global credential.helper store
$ git config --global user.name "Your Name"
$ git config --global user.email "y.name@tu-braunschweig.de"
$ git clone https://git.rz.tu-bs.de/systemsicherheit/teamprojekt/officemania.git
```

Use as Username your y-Number and as Password your freshly created access token.

Now, download [VSCode](https://code.visualstudio.com/) for Windows. Go to the Extension menu and install "Remote - WSL". Close VSCode and restart it using the Ubuntu terminal:

```
$ code
```
Make sure that you are connected remotely to WSL by checking the bottom left corner of your screen. It should say ">< WSL: Ubuntu". If not, go to the Remote-Explorer, right-click Ubuntu and select "Connect to WSL".

Go to File > Open Folder... and select the folder "officemania" you just cloned. You are ready to go!


To run a local server please install the following software using the Ubuntu terminal:

- [Node.js + npm](https://nodejs.org/en/) via

  ```
  $ curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  $ sudo apt install -y nodejs
  ```

  Test your installation with:

  ```
  $ node --version
  $ npm --version
  ```

  Node.js is used as our backend and is bundled with its dependency manager npm.

- TypeScript

  TypeScript is basically JavaScript if it were designed in more than two weeks. Its main benefit is (like the name suggests) its improved type system. Install it by running the npm command:

  ```
  $ npm install typescript --save-dev
  ```

- Project Dependencies

  Install all dependencies referenced in the `package.json` to the `node_modules` directory by running this npm command from the  officemania project folder:

  ```
  $ npm install
  ```

After installing the dependencies, you can test the installation by running

```
$ npm start
```

from the project folder. To check whether the installation was successful open http://localhost:3000/ and discover the world of OfficeMania!

## Usage

The `package.json` file contains the available npm-scripts. You can start them using:

```
$ npm run [command]
```

The most imporant commands are:
 - start: Starts a webserver
 - test: Runs all tests (*.test.ts files) in the project with [jest](https://jestjs.io/)

## Where to start?

- ./src/client/main.ts

  This is the entry-point for your client scripts (i.e. your "main" function). Here, we create the game loop, load assets and setup the general application.

- ./src/common

  This folder contains code that can be used by the server and client.

- ./src/server/main.ts

  This is the entry-point for your server scripts. It starts the webserver and uses Express.js to setup the routing.

- ./html/

  This folder (as specified in the server-main) contains all html files that are served to the user. 

- ./assets

  This folder contains all further assets that need to be served to the user (e.g. images, json-configs, ...)

## Dependency management

Feel free to modify or extend this setup (e.g. install dependencies, add npm run-scripts), but keep in mind that you have to synchronize your changes with your teammates as to not break existing code. You can add additional dependencies using npm:

```
npm install [some-package]
```

This will install the dependency in your `node_modules` folder and add the dependency to your `package.json`. For a lot of packages 'type annotations' (for typescript) are available, which enable auto-completions in your editor / IDE. To additionally install type annotations you can (often) run `npm install @types/[some-package]`.

If one of your fellow students added a dependency you first need to install it locally by running `npm install` before you can use it.

Please note that although you are free to install any dependency that you might find fitting for the project, we can not guarantee support for these packages.
