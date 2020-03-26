# Utilisation

<!--introduced_in=v0.10.0-->
<!--type=misc-->

`node [options] [V8 options] [script.js | -e "script" | - ] [arguments]`

Veuillez consulter le document [Options de ligne de commande](cli.html#cli_command_line_options) pour plus d’informations sur les différentes options et les moyens d’exécuter des scripts avec Node.js.

## Exemple
Exemple d’un [serveur web](http.html) écrit avec Node.js qui répond avec `« Hello World ! »` :

Les commandes utilisées dans ce document sont montrées commençant par `$` ou `>` pour simuler la façon dont elles seraient affichées dans le terminal de l’utilisateur. Do not include the `$` and `>` characters. They are there to indicate the start of each command.

Beaucoup de tutoriaux et d'exemples suivent cette convention: `$` or `>` pour les commandes exécutées comme un utilisateur standard, et `#` pour les commandes devant être exécutées en tant qu'administrateur.

Les lignes qui ne commencent pas par un caractère `$` ou `>` montrent généralement le résultat de la commande précédente.

Tout d’abord, assurez-vous d’avoir téléchargé et installé Node.js. Consultez [ce guide](https://nodejs.org/en/download/package-manager/) pour plus d’informations sur l'installation.

Now, create an empty project folder called `projects`, then navigate into it. The project folder can be named based on the user's current project title, but this example will use `projects` as the project folder.

Linux et Mac:

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

Ensuite, créez un nouveau fichier source dans le dossier `projects` et appelez-le `hello-world.js`.

En Node.js la pratique standard en matière de style est d'utiliser des tirets (`-`) ou des underscores (`_`) pour séparer plusieurs mots dans les noms de fichier.

Ouvrez `hello-world.js` dans n’importe quel éditeur de texte, selon votre préférence, et collez-y le contenu suivant:

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

Enregistrez le fichier, retournez à votre terminal et entrez la commande suivante :

```console
$ node hello-world.js
```

Une sortie telle que celle-ci devrait apparaître dans votre terminal pour indiquer que le serveur Node.js est en cours d'exécution:

 ```console
 Server running at http://127.0.0.1:3000/
 ```

Maintenant, ouvrez n’importe quel navigateur web, selon votre préférence, et visitez `http://127.0.0.1:3000`.

Si le navigateur affiche la chaîne `Hello, world !`, cela vous indique que le serveur fonctionne.

De nombreux exemples dans la documentation peuvent être exécutés de la même façon.
