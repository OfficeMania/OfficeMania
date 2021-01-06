```
   ____   __  __ _          __  __             _       
  / __ \ / _|/ _(_)        |  \/  |           (_)      
 | |  | | |_| |_ _  ___ ___| \  / | __ _ _ __  _  __ _ 
 | |  | |  _|  _| |/ __/ _ \ |\/| |/ _` | '_ \| |/ _` |
 | |__| | | | | | | (_|  __/ |  | | (_| | | | | | (_| |
  \____/|_| |_| |_|\___\___|_|  |_|\__,_|_| |_|_|\__,_|
```

Welcome to the Softwareentwicklungspraktikum 2021 as part of the **OfficeMania** project!

## Description

This repository contains a template that can be used as a basis for the SEP 2021. Its main purpose is to simplify the hassle of setting up a JS-project from scratch, so you have more time to focus on the planning and implementation phase of the project.

You might find the size of the template overwhelming at first, but let me assure you that most files are either configuration files, that are not relevant for you and are probably auto-generated, or are code files, that we extensively documented. In case you still have questions regarding elements in this template, do not hesitate to contact us - but please first take your time and try to understand them yourself.

[TypeScript](https://www.typescriptlang.org/) is used as the programming language both client- and server-wide. The server is based on [Node.js](https://nodejs.org/en/) (with [Express.js](https://expressjs.com/de/)) and the client scripts are generated using [webpack](https://webpack.js.org/); source code can be shared between client and server (src/common) so that, for example, client- and server-validations don't have to be written twice. Since you are creating a game-like application, an [authorative server](https://www.gabrielgambetta.com/client-server-game-architecture.html) needs to synchronize its state with the clients. This communication is done using [Colyseus](https://www.colyseus.io/). Lastly, [Jest](https://jestjs.io/) can be used for testing. All dependencies are managed using [npm](https://www.npmjs.com/).

## Installation

Please install the following software :

- [Node.js + npm](https://nodejs.org/en/) (Node-Version: 14.13.0 and npm-Version: 6.14.8)

  Node.js is used as our backend and is bundled with its dependency manager npm

- TypeScript (Version 4.1.3)

  TypeScript is basically JavaScript if it were designed in more than two weeks. Its main benefit is (like the name suggests) its improved type system. Install it system-wide by running the npm command:

  ```
  $ npm install -g tsc
  ```

  NOTE: If the installation fails, do **not** use sudo, but instead change your npm home folder [like this](https://stackoverflow.com/a/21712034).

- Project Dependencies

  Install all dependencies referenced in the `package.json` to the `node_modules` directory in your current project folder by running the npm command:

  ```
  $ npm install
  ```

After installing the dependencies, you can test the installation by running

```
npm start
```

from the project folder. To check whether the installation was successfull open http://localhost:3000/index.html in multiple tabs in your browser. The site should display an image where - for each tab - a right-moving rectangle is displayed. Once you close a tab, one rectangle should be removed in all other tabs.

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