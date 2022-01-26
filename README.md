```
   ____   __  __ _          __  __             _       
  / __ \ / _|/ _(_)        |  \/  |           (_)      
 | |  | | |_| |_ _  ___ ___| \  / | __ _ _ __  _  __ _ 
 | |  | |  _|  _| |/ __/ _ \ |\/| |/ _` | '_ \| |/ _` |
 | |__| | | | | | | (_|  __/ |  | | (_| | | | | | (_| |
  \____/|_| |_| |_|\___\___|_|  |_|\__,_|_| |_|_|\__,_|
```

Welcome to the **OfficeMania** project!
#

## Description

OfficeMania is an interactive open-source meeting soloution made for you and your team! Talk to people just as in real life, hold private meetings with interactive elements and play some pong. Nearly everything is possible.

In the following you can find a summary of all dependencies we used.

[TypeScript](https://www.typescriptlang.org/) is used as the programming language both client- and server-wide. The server is based on [Node.js](https://nodejs.org/en/) (with [Express.js](https://expressjs.com/de/)) and the client scripts are generated using [webpack](https://webpack.js.org/); source code can be shared between client and server (src/common) so that, for example, client- and server-validations don't have to be written twice. Since OfficeMania is a game-like application, an [authorative server](https://www.gabrielgambetta.com/client-server-game-architecture.html) needs to synchronize its state with the clients. This communication is done using [Colyseus](https://www.colyseus.io/). All dependencies are managed using [npm](https://www.npmjs.com/). The videochat is handled through [jit.si](https://www.jitsi.org/).

If you want to host your own instance of OfficeMania you can do so by following the instuctions for the installation on native Linux or on the Windows Subsystem for Linux under Windows 11.

#
## Installation on native Ubuntu


- Install Nodejs and typescript:

  ```
  $ curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  $ sudo apt install -y nodejs
  $ npm install typescript --save-dev
  ```
- Clone OfficeMania on your Computer.

  ```
  $ cd ~
  $ git config --global credential.helper store
  $ git config --global user.name "Your Name"
  $ git config --global user.email "your.email@example.com"
  $ git clone https://examplegitdomain.com/officemania.git
  ```

- In the just cloned folder run:

  ```
  $ npm install
  $ npm start
  ```
 
- Done! On http://localhost:3000/ you can find a running instance of OfficeMania. If you want to be able to join from anywhere, read the instructions below for setting up port forwarding. 

#

## Installation in WSL (Windows Subsystem for Linux) with VSCode and git over HTTPS

This option is recommended if you are planning to contribute to the code base of OfficeMania and don't want to leave Windows. Detailed version below.

**TL;TR**

- Install Nodejs and typescript in WSL.

  ```
  $ curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  $ sudo apt install -y nodejs
  $ npm install typescript --save-dev
  ```
- Clone OfficeMania into a location in the Linux filesystem.

  ```
  $ cd ~
  $ git config --global credential.helper store
  $ git config --global user.name "Your Name"
  $ git config --global user.email "your.email@example.com"
  $ git clone https://examplegitdomain.com/officemania.git
  ```

- Get the "Remote - WSL"-Extension for VSCode. In the project folder run:

  ```
  $ npm install
  $ npm start
  ```
 
- Done! On http://localhost:3000/ you can find a running instance of OfficeMania.


**Detailed version**


Set up WSL in Windows 10 version 2004 and higher (Build 19041 and higher) or Windows 11 by doing the following:

Search for PowerShell and start it as Administrator by right-clicking it. To install WSL, type:

```
$ wsl --install
```

Go to the Microsoft Store and install "Ubuntu". Restart your Computer.
Then open Ubuntu and set it up following the given instructions.

Clone the OfficeMania into a location in the Linux filesystem. To get there, go to ~:

```
$ cd ~
$ git config --global credential.helper store
$ git config --global user.name "Your Name"
$ git config --global user.email "your.email@example.com"
$ git clone https://examplegitdomain.com/officemania.git
```

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

#