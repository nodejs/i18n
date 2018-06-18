# Utilisation

<!--introduced_in=v0.10.0-->

<!--type=misc-->

`node [options] [V8 options] [script.js | -e "script" | - ] [arguments]`

Veuillez consulter le document [Options de ligne de commande](cli.html#cli_command_line_options) pour plus d’informations sur les différentes options et les moyens d’exécuter des scripts avec Node.js.

## Exemple

Exemple d’un [serveur web](http.html) écrit avec Node.js qui répond avec `« Hello World ! »` :

Les commandes utilisées dans ce document sont montrées commençant par `$` ou `>` pour simuler la façon dont elles seraient affichées dans le terminal de l’utilisateur. Ne tapez pas les caractères `$` and `>`, ils sont là pour indiquer le début de chaque commande.

Beaucoup de tutoriaux et d'exemples suivent cette convention: `$` or `>` pour les commandes exécutées comme un utilisateur standard, et `#` pour les commandes devant être exécutées en tant qu'administrateur.

Lines that don’t start with `$` or `>` character are typically showing the output of the previous command.

Firstly, make sure to have downloaded and installed Node.js. See [this guide](https://nodejs.org/en/download/package-manager/) for further install information.

Now, create an empty project folder called `projects`, navigate into it: Project folder can be named base on user's current project title but this example will use `projects` as the project folder.

Linux and Mac:

```console
$ mkdir ~/projects
$ cd ~/projects
```

Windows CMD:

```console
> mkdir %USERPROFILE%\projects
> cd %USERPROFILE%\projects
```

Windows PowerShell:

```console
> mkdir $env:USERPROFILE\projects
> cd $env:USERPROFILE\projects
```

Next, create a new source file in the `projects` folder and call it `hello-world.js`.

In Node.js it is considered good style to use hyphens (`-`) or underscores (`_`) to separate multiple words in filenames.

Open `hello-world.js` in any preferred text editor and paste in the following content.

```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

Save the file, go back to the terminal window enter the following command:

```console
$ node hello-world.js
```

An output like this should appear in the terminal to indicate Node.js server is running:

```console
Server running at http://127.0.0.1:3000/
```

Now, open any preferred web browser and visit `http://127.0.0.1:3000`.

If the browser displays the string `Hello, world!`, that indicates the server is working.

Many of the examples in the documentation can be run similarly.