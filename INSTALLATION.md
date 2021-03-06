```
   ____   __  __ _          __  __             _       
  / __ \ / _|/ _(_)        |  \/  |           (_)      
 | |  | | |_| |_ _  ___ ___| \  / | __ _ _ __  _  __ _ 
 | |  | |  _|  _| |/ __/ _ \ |\/| |/ _` | '_ \| |/ _` |
 | |__| | | | | | | (_|  __/ |  | | (_| | | | | | (_| |
  \____/|_| |_| |_|\___\___|_|  |_|\__,_|_| |_|_|\__,_|
```

#

Here you can find installation instuctions for native Ubuntu systems and for Windows Subsystem on Linux.

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

- Done! On http://localhost:3000/ you can find a running instance of OfficeMania.

#

## Installation in WSL (Windows Subsystem for Linux) with VSCode and git over HTTPS

This option is recommended if you are planning to contribute to the code base of OfficeMania and don't want to leave
Windows. Detailed version below.

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

<br>
<br>

**Detailed version**

Set up WSL in Windows 10 version 2004 and higher (Build 19041 and higher) or Windows 11 by doing the following:

Search for PowerShell and start it as Administrator by right-clicking it. To install WSL, type:

```
$ wsl --install
```

Go to the Microsoft Store and install "Ubuntu". Restart your Computer. Then open Ubuntu and set it up following the
given instructions.

Clone the OfficeMania into a location in the Linux filesystem. To get there, go to ~:

```
$ cd ~
$ git config --global credential.helper store
$ git config --global user.name "Your Name"
$ git config --global user.email "your.email@example.com"
$ git clone https://examplegitdomain.com/officemania.git
```

Now, download [VSCode](https://code.visualstudio.com/) for Windows. Go to the Extension menu and install "Remote - WSL".
Close VSCode and restart it using the Ubuntu terminal:

```
$ code
```

Make sure that you are connected remotely to WSL by checking the bottom left corner of your screen. It should say "><
WSL: Ubuntu". If not, go to the Remote-Explorer, right-click Ubuntu and select "Connect to WSL".

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

  TypeScript is basically JavaScript if it were designed in more than two weeks. Its main benefit is (like the name
  suggests) its improved type system. Install it by running the npm command:

  ```
  $ npm install typescript --save-dev
  ```

- Project Dependencies

  Install all dependencies referenced in the `package.json` to the `node_modules` directory by running this npm command
  from the officemania project folder:

  ```
  $ npm install
  ```

After installing the dependencies, you can test the installation by running

```
$ npm start
```

from the project folder. To check whether the installation was successful open http://localhost:3000/ and discover the
world of OfficeMania!

#

## Installation in a Docker Container

### Application Setup

Access the container at http://dockerhost:8080.

### Usage

Here are some example snippets to help you get started creating a container.

#### docker-compose (recommended)

```yaml
---
version: "2"
services:
  officemania:
    image: index.docker.io/panzer1119/officemania
    container_name: officemania
    volumes:
      - ./database.sqlite:/app/database.sqlite
    ports:
      - "8080:8080"
    restart: unless-stopped
```

#### docker cli

```bash
docker run -d \
  --name=officemania \
  -p 8080:8080 \
  -v ./database.sqlite:/app/database.sqlite \
  --restart unless-stopped \
  index.docker.io/panzer1119/officemania
```

### Parameters

Container images are configured using parameters passed at runtime (such as those above). These parameters are separated
by a colon and indicate `<external>:<internal>` respectively. For example, `-p 8080:8080` would expose port `8080` from
inside the container to be accessible from the host's IP on port `8080` outside the container.

| Parameter | Function                                                       |
|:---------:|----------------------------------------------------------------|
| `-p 8080` | will map the container's port 8080 to port 8080 on the host    |
|  `-v ./database.sqlite`  | this will store the database the app |

### Building locally

If you want to make local modifications to these images for development purposes or just to customize the logic:

```bash
git clone https://git.rz.tu-bs.de/systemsicherheit/teamprojekt/officemania.git
cd officemania
docker build \
  --no-cache \
  --pull \
  -t index.docker.io/panzer1119/officemania:latest .
```

# TODO
- Add Parameter Explanation for bcrypt/password versioning, (jwt?) secrets etc
- Add PostgreSQL Container
- Add commands to create Migrations

```bash
npm run typeorm migration:generate -- -p -n $NAME --dry-run
```

```bash
npm run typeorm migration:generate -- -p -n $NAME
```
