# Utilizzo

<!--introduced_in=v0.10.0-->
<!--type=misc-->

`node [options] [V8 options] [script.js | -e "script" | - ] [arguments]`

Si prega di consultare il documento [Opzioni di Riga di Comando](cli.html#cli_command_line_options) per informazioni sulle diverse opzioni e modalità per eseguire gli script con Node.js.

## Esempio
Un esempio di un [server web](http.html) scritto con Node.js che risponde con `'Hello World!'`:

I comandi visualizzati in questo documento vengono mostrati iniziando con `$` o `>` per simulare il modo in cui apparirebbero in un terminal dell'utente. Do not include the `$` and `>` characters. They are there to indicate the start of each command.

Ci sono molti tutorial ed esempi che seguono questa convenzione:`$` o `>` per comandi eseguiti come utente normale, e `#` per comandi che dovrebbero essere eseguiti come amministratore.

Le righe che non iniziano con i caratteri `$` o `>` di solito mostrano l'output del comando precedente.

Prima di tutto, assicurati di aver scaricato e installato Node.js. Visualizza [questa guida](https://nodejs.org/en/download/package-manager/) per ulteriori informazioni sull'installazione.

Now, create an empty project folder called `projects`, then navigate into it. The project folder can be named based on the user's current project title, but this example will use `projects` as the project folder.

Linux e Mac:

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

Successivamente, creare un nuovo file sorgente nella cartella `projects` e chiamarlo `hello-world.js`.

In Node.js è considerata buona prassi utilizzare i trattini (`-`) o trattini bassi (`_`) per separare più parole nei nomi dei file.

Apri `hello-world.js` in qualsiasi editor di testo preferito e copia il contenuto seguente al suo interno:

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

Salva il file, ritorna alla finestra del terminal e inserisci il seguente comando:

```console
$ node hello-world.js
```

Un output come il seguente dovrebbe apparire nel terminal per indicare che il server Node.js è in esecuzione:

 ```console
 Server running at http://127.0.0.1:3000/
 ```

Adesso, apri un qualsiasi browser web preferito e visita l'indirizzo `http:/127.0.0.1.3000`.

Se il browser mostra la stringa `Hello, world!`, significa che il server funziona.

Molti degli esempi presenti nella documentazione possono essere eseguiti allo stesso modo.
