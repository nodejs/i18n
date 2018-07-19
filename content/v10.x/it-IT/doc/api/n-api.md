# N-API

<!--introduced_in=v7.10.0-->

<!-- type=misc -->

> Stabilità: 2 - Stabile

N-API (pronunciato N come la lettera stessa, seguito da API) è un'API per la creazione di Addons nativi. È indipendente dal runtime JavaScript sottostante (es. V8) e viene mantenuto come parte dello stesso Node.js. Quest'API sarà stabile in Application Binary Interface (ABI) tra le versioni di Node.js. Ha lo scopo di isolare gli Addons dalle modifiche nell'engine JavaScript sottostante e consentire ai moduli compilati per una versione di essere eseguiti nelle versioni successive di Node.js senza ricompilazione.

Gli Addons sono costruiti/impacchettati con lo stesso approccio/gli stessi tools evidenziati nella sezione intitolata [Addons C++](addons.html). L'unica differenza è l'insieme di API utilizzate dal codice nativo. Invece di utilizzare le API di V8 o di [Native Abstractions per Node.js](https://github.com/nodejs/nan), vengono utilizzate le funzioni disponibili in N-API.

Le API esposte da N-API vengono generalmente utilizzate per creare e manipolare i valori di JavaScript. I concepts e le operations generalmente mappano le idee specificate in "ECMA262 Language Specification". Le API hanno le seguenti proprietà:

- Tutte le chiamate N-API restituiscono(return) uno status code di tipo `napi_status`. Questo stato indica se la chiamata API è avvenuta con successo oppure no.
- Il valore di return dell'API viene passato tramite un parametro out.
- Tutti i valori di JavaScript sono astratti dietro un tipo opaco chiamato `napi_value`.
- In caso di status code di errore, è possibile ottenere ulteriori informazioni utilizzando `napi_get_last_error_info`. Ulteriori informazioni possono essere trovate nella sezione di gestione degli errori [Gestione degli Errori](#n_api_error_handling).

Il N-API è un'API C che garantisce la stabilità dell'ABI attraverso le versioni di Node.js e diversi livelli del compilatore. Tuttavia, capiamo che un'API C++ può essere più facile da usare in molti casi. Per supportare questi casi ci aspettiamo che ci siano uno o più moduli wrapper C++ che forniscano un'API C++ inlineable. I file binari creati con questi moduli wrapper dipenderanno dai simboli per le funzioni basate su N-API C esportate da Node.js. Questi wrappers non fanno parte di N-API, né saranno mantenuti come parte di Node.js. Uno di questi esempi è: [node-addon-api](https://github.com/nodejs/node-addon-api).

Per utilizzare le funzioni di N-API, includere il file [`node_api.h`](https://github.com/nodejs/node/blob/master/src/node_api.h) che si trova nella directory src nel node development tree:

```C
#include <node_api.h>
```

## Data Types N-API di base

N-API espone i seguenti datatypes fondamentali come abstractions che vengono utilizzate dalle varie API. Queste API devono essere considerate come opache, auto-esaminabile (introspectable) solo con altre chiamate N-API.

### napi_status

Status code integrale che indica il successo oppure il fallimento di una chiamata N-API. Attualmente sono supportati i seguenti status codes.

```C
typedef enum {
  napi_ok,
  napi_invalid_arg,
  napi_object_expected,
  napi_string_expected,
  napi_name_expected,
  napi_function_expected,
  napi_number_expected,
  napi_boolean_expected,
  napi_array_expected,
  napi_generic_failure,
  napi_pending_exception,
  napi_cancelled,
  napi_escape_called_twice,
  napi_handle_scope_mismatch,
  napi_callback_scope_mismatch
} napi_status;
```

Se viene richiesta qualche informazione aggiuntiva su un'API che restituisce un failed status, può essere ottenuta chiamando `napi_get_last_error_info`.

### napi_extended_error_info

```C
typedef struct {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
} napi_extended_error_info;
```

- `error_message`: Stringa con codifica UTF8 contenente una descrizione neutrale dell'errore da parte della VM.
- `engine_reserved`: Riservato per i dettagli degli errori specifici della VM. Questo non è attualmente implementato per qualsiasi VM.
- `engine_error_code`: Error code specifico della VM. Questo non è attualmente implementato per qualsiasi VM.
- `error_code`: Lo status code di N-API che ha avuto origine con l'ultimo errore.

Vedi la sezione [Gestione degli Errori](#n_api_error_handling) per ulteriori informazioni.

### napi_env

`napi_env` viene utilizzato per rappresentare un contesto che l'implementazione N-API sottostante può utilizzare per mantenere lo stato specifico della VM. Questa struttura viene passata alle funzioni native quando vengono invocate, e dev'essere passata indietro quando si effettuano chiamate N-API. Nello specifico, lo stesso `napi_env`, che è stato passato quand'è stata chiamata la funzione nativa iniziale, deve essere passato a tutte le successive chiamate N-API nidificate. Non è consentito memorizzare nella cache `napi_env` ai fini del riutilizzo generale.

### napi_value

Questo è un puntatore opaco che viene utilizzato per rappresentare un valore JavaScript.

### Tipi di N-API Memory Management

#### napi_handle_scope

Questa è un'abstraction utilizzata per controllare e modificare la durata degli objects creati all'interno di un particolare scope. In generale, i valori N-API vengono creati nel contesto di un handle scope. Nel momento in cui un metodo nativo viene chiamato da JavaScript, esisterà un handle scope predefinito. Se l'utente non crea esplicitamente un nuovo handle scope, i valori N-API verranno creati nell'handle scope predefinito. Per ogni invocazione di codice al di fuori dell'esecuzione di un metodo nativo (ad esempio, durante l'invocazione di una callback per libuv), è richiesto il modulo per creare uno scope prima di invocare qualsiasi funzione che può comportare la creazione di valori JavaScript.

Gli handle scopes vengono creati usando [`napi_open_handle_scope`][] e vengono distrutti usando [`napi_close_handle_scope`][]. La chiusura dello scope può indicare al GC che tutti i `napi_value` creati nel corso della durata dell'handle scope non sono più referenziati dallo stack frame corrente.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope

Gli handle scopes di tipo escapable sono un tipo speciale di handle scope per restituire valori creati all'interno di un particolare handle scope ad un parent scope.

#### napi_ref

Questa è l'abstraction da usare per fare riferimento a `napi_value`. Ciò consente agli utenti di gestire la durata dei valori JavaScript, compresa la definizione in modo esplicito della loro durata minima.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

### Tipi di N-API Callback

#### napi_callback_info

Datatype opaco passato ad una funzione di callback. Può essere utilizzato per ottenere informazioni aggiuntive sul contesto in cui è stato invocato il callback.

#### napi_callback

Tipo di funzione puntatore per le funzioni native fornite dall'utente che devono essere esposte a JavaScript tramite N-API. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize

Function pointer type for add-on provided functions that allow the user to be notified when externally-owned data is ready to be cleaned up because the object with which it was associated with, has been garbage-collected. The user must provide a function satisfying the following signature which would get called upon the object's collection. Currently, `napi_finalize` can be used for finding out when objects that have external data are collected.

```C
typedef void (*napi_finalize)(napi_env env,
                              void* finalize_data,
                              void* finalize_hint);
```

#### napi_async_execute_callback

Funzione puntatore utilizzato con funzioni che supportano operazioni asincrone. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

#### napi_async_complete_callback

Funzione puntatore utilizzato con funzioni che supportano operazioni asincrone. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

## Gestione degli Errori

N-API utilizza sia i valori return che le eccezioni JavaScript per la gestione degli errori. Le seguenti sezioni spiegano l'approccio per ciascun caso.

### Valori Return

Tutte le funzioni N-API condividono lo stesso modello di gestione degli errori. Il tipo di return di tutte le funzioni API è `napi_status`.

Il valore return sarà `napi_ok` se la richiesta è stata eseguita correttamente e se non è stata generata alcuna eccezione JavaScript non rilevata. Se si è verificato un errore ED è stata generata un'eccezione, verrà restituito il valore `napi_status` per l'errore. Se è stata generata un'eccezione, e non si è verificato alcun errore, verrà restituito `napi_pending_exception`.

Nei casi in cui viene restituito un valore return diverso da `napi_ok` o `napi_pending_exception`, è necessario chiamare [`napi_is_exception_pending`][] per verificare se c'è un'eccezione in sospeso. Vedi la sezione sulle eccezioni per maggiori dettagli.

Il set completo di possibili valori `napi_status` è definito in `napi_api_types.h`.

Il valore return `napi_status` fornisce una rappresentazione indipendente dell'errore verificatosi da parte della VM. In some cases it is useful to be able to get more detailed information, including a string representing the error as well as VM (engine)-specific information.

Per recuperare queste informazioni viene fornito [`napi_get_last_error_info`][] che restituisce una struttura `napi_extended_error_info`. Il formato della struttura `napi_extended_error_info` è il seguente:

```C
typedef struct napi_extended_error_info {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
};
```

- `error_message`: Rappresentazione testuale dell'errore che si è verificato.
- `engine_reserved`: Handle opaco riservato solo all'uso dell'engine.
- `engine_error_code`: Error code specifico della VM.
- `error_code`: Status code n-api per l'ultimo errore.

[`napi_get_last_error_info`][] restituisce le informazioni per l'ultima chiamata N-API che è stata effettuata.

Non fare affidamento sul contenuto o sul formato di una qualsiasi delle extended information in quanto non è soggetto a SemVer e può cambiare in qualsiasi momento. È inteso solo per scopi di registrazione.

#### napi_get_last_error_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status
napi_get_last_error_info(napi_env env,
                         const napi_extended_error_info** result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: La struttura `napi_extended_error_info` con ulteriori informazioni sull'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API recupera una struttura `napi_extended_error_info` con informazioni sull'ultimo errore che si è verificato.

Il contenuto del `napi_extended_error_info` restituito è valido solo finché non viene chiamata una funzione n-api sullo stesso `env`.

Non fare affidamento sul contenuto o sul formato di una qualsiasi delle extended information in quanto non è soggetto a SemVer e può cambiare in qualsiasi momento. È inteso solo per scopi di registrazione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Eccezioni

Qualsiasi chiamata alla funzione N-API può causare un'eccezione JavaScript in sospeso. Questo è ovviamente il caso per qualsiasi funzione che potrebbe causare l'esecuzione di JavaScript, ma N-API specifica che un'eccezione potrebbe essere in attesa di return da una qualsiasi delle funzioni API.

Se il `napi_status` restituito da una funzione è `napi_ok`, allora non è in sospeso alcuna eccezione e non è richiesta alcuna azione aggiuntiva. Se il `napi_status` restituito è qualcosa di diverso da `napi_ok` o `napi_pending_exception`, per provare a recuperare e continuare anzichè restituire immediatamente, bisogna chiamare [`napi_is_exception_pending`][] per determinare se un'eccezione è in sospeso o meno.

Quando un'eccezione è in sospeso, è possibile utilizzare uno dei seguenti due approcci.

Il primo approccio consiste nel fare qualsiasi pulizia appropriata e successivamente fare il return in modo che l'esecuzione ritorni a JavaScript. Appena parte della transizione torna a JavaScript, l'eccezione verrà lanciata al punto nel codice JavaScript in cui è stato invocato il metodo nativo. Il comportamento della maggior parte delle chiamate N-API, mentre un'eccezione è in sospeso, non è specificato, e molte restituiscono semplicemente `napi_pending_exception`, quindi è importante fare il meno possibile e di conseguenza fare il return a JavaScript dove l'eccezione può essere gestita.

Il secondo approccio è provare a gestire l'eccezione. Ci saranno casi in cui il codice nativo può catturare l'eccezione, bisogna prendere l'azione giusta e dopo continuare. Questo è consigliato solo nei casi specifici in cui è noto che l'eccezione può essere gestita in sicurezza. In questi casi [`napi_get_and_clear_last_exception`][] può essere utilizzato per ottenere e cancellare l'eccezione. In caso di esito positivo, il risultato conterrà l'handle fino all'ultimo JavaScript `Object` lanciato. Se viene determinato, dopo aver recuperato l'eccezione, essa non può essere gestita tuttavia può essere rilanciata con [`napi_throw`][] dove l'errore è il JavaScript `Error` object da lanciare.

Le seguenti funzioni utility sono disponibili anche nel caso in cui il codice nativo debba generare un'eccezione o determinare se un `napi_value` è un'istanza di un JavaScript `Error` object: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] e [`napi_is_error`][].

Le seguenti funzioni utility sono disponibili anche nel caso in cui il codice nativo necessiti di creare un `Error` object: [`napi_create_error`][], [`napi_create_type_error`][], e [`napi_create_range_error`][], dove il risultato è il `napi_value` che fa riferimento al JavaScript `Error` object appena creato.

Il progetto Node.js aggiunge error codes a tutti gli errori generati internamente. L'obiettivo è che le applicazioni utilizzino questi error codes per il controllo di tutti gli errori. I messaggi di errato associato rimarranno, ma verranno utilizzati solo per la registrazione e la visualizzazione con l'aspettativa che il messaggio possa cambiare senza applicare SemVer. Per supportare questo modello con N-API, sia nelle funzionalità interne che per le funzionalità specifiche del modulo (come buona pratica), le funzioni `throw_` e `create_` richiedono un parametro di codice opzionale che è la stringa per il codice da aggiungere all'error object. Se il parametro opzionale è NULL, nessun codice verrà associato all'errore. Se viene fornito un codice, viene aggiornato anche il nome associato all'errore:

```text
originalName [code]
```

dove `originalName` è il nome originale associato all'errore e `code` è il codice che è stato fornito. Ad esempio se il codice è `'ERR_ERROR_1'` ed un `TypeError` è in fase di creazione, il nome sarà:

```text
TypeError [ERR_ERROR_1]
```

#### napi_throw

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw(napi_env env, napi_value error);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] error`: Il valore JavaScript da lanciare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia il valore JavaScript fornito.

#### napi_throw_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_error(napi_env env,
                                         const char* code,
                                         const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: La stringa C che rappresenta il testo da associare all'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `Error` con il testo fornito.

#### napi_throw_type_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_type_error(napi_env env,
                                              const char* code,
                                              const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: La stringa C che rappresenta il testo da associare all'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `TypeError` con il testo fornito.

#### napi_throw_range_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_range_error(napi_env env,
                                               const char* code,
                                               const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: La stringa C che rappresenta il testo da associare all'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `RangeError` con il testo fornito.

#### napi_is_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_is_error(napi_env env,
                                      napi_value value,
                                      bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] msg`: Il `napi_value` da verificare.
- `[out] result`: Valore booleano impostato su true se `napi_value` rappresenta un errore, in caso contrario false.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API richiede un `napi_value` per verificare se rappresenta un error object.

#### napi_create_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_error(napi_env env,
                                          napi_value code,
                                          napi_value msg,
                                          napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: `napi_value` opzionale con la stringa per l'error code da associare all'errore.
- `[in] msg`: `napi_value` che fa riferimento ad una JavaScript `String` da utilizzare come messaggio per l'`Error`.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `Error` con il testo fornito.

#### napi_create_type_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_type_error(napi_env env,
                                               napi_value code,
                                               napi_value msg,
                                               napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: `napi_value` opzionale con la stringa per l'error code da associare all'errore.
- `[in] msg`: `napi_value` che fa riferimento ad una JavaScript `String` da utilizzare come messaggio per l'`Error`.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `TypeError` con il testo fornito.

#### napi_create_range_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_range_error(napi_env env,
                                                napi_value code,
                                                const char* msg,
                                                napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: `napi_value` opzionale con la stringa per l'error code da associare all'errore.
- `[in] msg`: `napi_value` che fa riferimento ad una JavaScript `String` da utilizzare come messaggio per l'`Error`.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `RangeError` con il testo fornito.

#### napi_get_and_clear_last_exception

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: L'eccezione se una è in sospeso, in caso contrario NULL.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce true se è in sospeso un'eccezione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_is_exception_pending

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: Valore booleano impostato su true se è in sospeso un'eccezione.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce true se è in sospeso un'eccezione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_fatal_exception

<!-- YAML
added: v9.10.0
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] err`: L'errore che vuoi passare ad `'uncaughtException'`.

Attiva un `'uncaughtException'` in JavaScript. Utile se una callback asincrona lancia un'eccezione senza possibilità di recupero.

### Fatal Errors

In caso di errore irreversibile in un modulo nativo, è possibile lanciare un fatal error per interrompere immediatamente il processo.

#### napi_fatal_error

<!-- YAML
added: v8.2.0
-->

```C
NAPI_NO_RETURN void napi_fatal_error(const char* location,
                                                 size_t location_len,
                                                 const char* message,
                                                 size_t message_len);
```

- `[in] location`: Posizione opzionale in cui si è verificato l'errore.
- `[in] location_len`: La lunghezza della posizione in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[in] message`: Il messaggio associato all'errore.
- `[in] message_len`: La lunghezza del messaggio in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.

La funzione call non restituisce nulla, il processo verrà terminato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Object Lifetime management

Quando vengono effettuate le N-API calls, gli handles per gli objects nell'heap per la VM sottostante possono essere restituiti come `napi_values`. Questi handles devono mantenere gli objects 'vivi' fino a quando non sono più richiesti dal codice nativo, altrimenti gli objects potrebbero essere raccolti prima che il codice nativo finisca di usarli.

Man mano che object handles vengono restituiti, essi vengono associati a uno 'scope'. La durata dello scope predefinito è legata alla durata della chiamata al metodo nativo. Il risultato è che, per impostazione predefinita, gli handles restano validi e gli objects associati a questi handles verranno mantenuti vivi per la durata della chiamata al metodo nativo.

In molti casi, tuttavia, è necessario che gli handles restino validi per una durata più breve o più lunga rispetto a quella del metodo nativo. Le sezioni che seguono descrivono le funzioni N-API che possono essere utilizzate per cambiare la durata predefinita dell'handle.

### Rendere la durata dell'handle più breve rispetto a quella del metodo nativo

Spesso è necessario rendere la durata degli handles più breve rispetto alla durata di un metodo nativo. Ad esempio, si consideri un metodo nativo che ha un ciclo che itera attraverso gli elementi in un array di grandi dimensioni:

```C
for (int i = 0; i < 1000000; i++) {
  napi_value result;
  napi_status status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // fare qualcosa con l'elemento.
}
```

Questo comporterebbe la creazione di un numero elevato di handles, che consumano risorse sostanziali. Inoltre, anche se il codice nativo potrebbe usare solo l'handle più recente, tutti gli objects associati sarebbero mantenuti in vita poiché condividono tutti lo stesso scope.

Per gestire questo caso, N-API offre la capacità di stabilire un nuovo 'scope' al quale verranno associati gli handles appena creati. Una volta che tali handles non sono più necessari, lo scope può essere 'chiuso' e qualsiasi handle associato allo scope viene invalidato. I metodi disponibili per aprire/chiudere gli scopes sono [`napi_open_handle_scope`][] e [`napi_close_handle_scope`][].

N-API supporta solo una singola gerarchia nidificata di scopes. C'è un solo scope attivo in qualsiasi momento e tutti i nuovi handles saranno associati ad esso mentre è attivo. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati aperti. Inoltre, tutti gli scopes creati all'interno di un metodo nativo devono essere chiusi prima di ritornare da quel metodo.

Prendendo l'esempio precedente, l'aggiunta di calls a [`napi_open_handle_scope`][] e [`napi_close_handle_scope`][] assicurerebbe che, al massimo, un singolo handle sia valido durante l'esecuzione del ciclo:

```C
or (int i = 0; i < 1000000; i++) {
  napi_handle_scope scope;
  napi_status status = napi_open_handle_scope(env, &scope);
  if (status != napi_ok) {
    break;
  }
  napi_value result;
  status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // fare qualcosa con l'elemento
  status = napi_close_handle_scope(env, scope);
  if (status != napi_ok) {
    break;
  }
}
```

Quando si annidano gli scopes, ci sono casi in cui un handle da uno scope interno debba vivere oltre la durata di quello scope. N-API supporta un 'escapable scope' al fine di sostenere questo caso. Un escapable scope consente ad un handle di essere 'promosso' in modo che esso 'ignori' lo scope corrente e la sua durata cambi da quella dello scope corrente a quella dello scope esterno.

I metodi disponibili per aprire/chiudere gli escapable scopes sono [`napi_open_escapable_handle_scope`][] e [`napi_close_escapable_handle_scope`][].

La richiesta per promuovere un handle viene effettuata tramite [`napi_escape_handle`][] che può essere chiamato una sola volta.

#### napi_open_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API apre un nuovo scope.

#### napi_close_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati creati.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_open_escapable_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status
    napi_open_escapable_handle_scope(napi_env env,
                                     napi_handle_scope* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API apre un nuovo scope da cui è possibile promuovere un oggetto allo scope esterno.

#### napi_close_escapable_handle_scope

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status
    napi_close_escapable_handle_scope(napi_env env,
                                      napi_handle_scope scope);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati creati.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_escape_handle

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope corrente.
- `[in] escapee`: `napi_value` che rappresenta il JavaScript `Object` di JavaScript che deve essere ignorato.
- `[out] result`: `napi_value` che rappresenta l'handle per l'`Object` ignorato nello scope esterno.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API promuove l'handle per il JavaScript object in modo che sia valido per la durata dello scope esterno. Può essere chiamato solo una volta per ogni scope. Se viene chiamato più di una volta, verrà restituito un errore.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Reference ad objects con una durata superiore a quella del metodo nativo

In alcuni casi un addon dovrà essere in grado di creare e fare reference ad objects con una durata superiore a quella di una sola invocazione del metodo nativo. Ad esempio, per creare un constructor e successivamente utilizzare tale constructor in una richiesta per creare istanze, deve essere possibile fare reference al constructor object in richieste di creazione di istanze di ogni tipo. Questo non sarebbe possibile con un handle normale restituito come `napi_value` come descritto nella sezione precedente. La durata di un normale handle è gestita dagli scopes e tutti gli scopes devono essere chiusi prima della fine di un metodo nativo.

N-API fornisce metodi per creare reference persistenti ad un object. Ogni reference persistente ha un count associato con un valore pari a 0 o superiore. Il count determina se il reference manterrà vivo l'oggetto corrispondente. I reference con un count di 0 non impediscono la raccolta dell'object e sono spesso denominati reference 'deboli'. Qualsiasi count superiore a 0 impedirà la raccolta dell'object.

I reference possono essere creati con un reference count iniziale. Il count può quindi essere modificato tramite [`napi_reference_ref`][] e [`napi_reference_unref`][]. Se un object viene raccolto mentre il count per un reference è 0, tutte le chiamate successive per ottenere l'object associato al reference [`napi_get_reference_value`][] restituiranno NULL per il valore restituito `napi_value`. Un tentativo di chiamare [`napi_reference_ref`][] per un reference il cui object è stato raccolto genererà un errore.

I reference devono essere cancellati una volta che non sono più richiesti dall'addon. Quando un reference viene eliminato, non impedirà più all'object corrispondente di essere raccolto. La mancata eliminazione di un reference persistente comporterà una 'perdita di memoria' sia con la memoria nativa per il reference persistente sia con l'object corrispondente sull'heap che sarà mantenuto per sempre.

Possono essere creati più reference persistenti che si riferiscono allo stesso object, ognuno dei quali manterrà l'object vivo o meno in base al proprio count.

#### napi_create_reference

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_reference(napi_env env,
                                              napi_value value,
                                              int initial_refcount,
                                              napi_ref* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta l'`Object` per il quale vogliamo un reference.
- `[in] initial_refcount`: Reference count iniziale per il nuovo reference.
- `[out] result`: `napi_ref` che punta al nuovo reference.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un nuovo reference con il reference count specificato sull'`Object` passato.

#### napi_delete_reference

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` da cancellare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API cancella il reference passato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_reference_ref

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_reference_ref(napi_env env,
                                           napi_ref ref,
                                           int* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale verrà incrementato il reference count.
- `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API incrementa il reference count per il reference passato e restituisce il reference count risultante.

#### napi_reference_unref

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_reference_unref(napi_env env,
                                             napi_ref ref,
                                             int* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale verrà decrementato il reference count.
- `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API decrementa il reference count per il reference passato e restituisce il reference count risultante.

#### napi_get_reference_value

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_get_reference_value(napi_env env,
                                                 napi_ref ref,
                                                 napi_value* result);
```

il `napi_value` passato all'interno o all'esterno da questi metodi è un handle per l'object a cui è collegato il reference.

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale richiediamo l'`Object` corrispondente.
- `[out] result`: Il `napi_value` per l'`Object` a cui fa riferimento `napi_ref`.

Restituisce `napi_ok` se l'API ha esito positivo.

Se ancora valida, quest'API restituisce il `napi_value` che rappresenta il JavaScript `Object` associato a `napi_ref`. In caso contrario, il risultato sarà NULL.

## Registrazione del Modulo

I moduli N-API sono registrati in modo simile ad altri moduli tranne per il fatto che anziché utilizzare la macro `NODE_MODULE` viene utilizzata la seguente:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

La prossima differenza è la dicitura per il metodo `Init`. Per un modulo N-API è la seguente:

```C
napi_value Init(napi_env env, napi_value exports);
```

Il valore restituito da `Init` viene considerato come `exports` object per il modulo. Il metodo `Init` passa un empty object tramite il parametro `exports` per comodità. Se `Init` restituisce NULL, il parametro passato come `exports` viene esportato dal modulo. I moduli N-API non possono modificare il `module` object ma possono specificare qualsiasi cosa come la proprietà `exports` del modulo.

Per aggiungere il metodo `hello` come una funzione in modo che possa essere chiamato come metodo fornito dall'addon:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor desc =
    {"hello", NULL, Method, NULL, NULL, NULL, napi_default, NULL};
  status = napi_define_properties(env, exports, 1, &desc);
  if (status != napi_ok) return NULL;
  return exports;
}
```

Per impostare una funzione in modo che venga restituita da `require()` per l'addon:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_value method;
  napi_status status;
  status = napi_create_function(env, "exports", NAPI_AUTO_LENGTH, Method, NULL, &method);
  if (status != napi_ok) return NULL;
  return method;
}
```

Per definire una classe in modo che possano essere create nuove istanze (spesso utilizzato con [Object Wrap](#n_api_object_wrap)):

```C
// NOTA: esempio parziale, non è incluso tutto il codice di riferimento
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor properties[] = {
    { "value", NULL, NULL, GetValue, SetValue, NULL, napi_default, NULL },
    DECLARE_NAPI_METHOD("plusOne", PlusOne),
    DECLARE_NAPI_METHOD("multiply", Multiply),
  };

  napi_value cons;
  status =
      napi_define_class(env, "MyObject", New, NULL, 3, properties, &cons);
  if (status != napi_ok) return NULL;

  status = napi_create_reference(env, cons, 1, &constructor);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "MyObject", cons);
  if (status != napi_ok) return NULL;

  return exports;
}
```

Se ti aspetti che il tuo modulo venga caricato più volte durante il ciclo del processo Node.js, puoi utilizzare la macro `NAPI_MODULE_INIT` per inizializzare il tuo modulo:

```C
NAPI_MODULE_INIT() {
  napi_value answer;
  napi_status result;

  status = napi_create_int64(env, 42, &answer);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "answer", answer);
  if (status != napi_ok) return NULL;

  return exports;
}
```

Questa macro include `NAPI_MODULE`, e dichiara una funzione `Init` con un nome speciale e con una visibilità superiore all'addon. Questo consentirà a Node.js di inizializzare il modulo anche se viene caricato più volte.

Le variabili `env` ed `exports` saranno disponibili all'interno del corpo della funzione in seguito all'invocazione della macro.

Per maggiori dettagli sul settaggio delle proprietà sugli objects, vedi la sezione [Lavorare con le proprietà JavaScript](#n_api_working_with_javascript_properties).

Per maggiori dettagli sulla costruzione di moduli addon in generale, fare riferimento all'API esistente.

## Lavorare con i valori JavaScript

N-API espone un set di API per creare tutti i tipi di valori JavaScript. Alcuni di questi tipi sono documentati nella [Section 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) del [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Fondamentalmente, queste API vengono utilizzate per eseguire una delle seguenti operazioni:

1. Creare un nuovo JavaScript object
2. Convertire da un tipo C primitivo ad un valore N-API
3. Converti da un valore N-API ad un tipo C primitivo
4. Ottenere istanze globali tra cui `undefined` e `null`

I valori N-API sono rappresentati dal tipo `napi_value`. Qualsiasi chiamata N-API che richiede un valore JavaScript accetta un `napi_value`. In alcuni casi, l'API controlla il tipo del `napi_value` in anticipo. Tuttavia, per prestazioni migliori, è meglio che il caller si assicuri che il `napi_value` in questione sia del tipo JavaScript previsto dall'API.

### Tipi di Enum

#### napi_valuetype

```C
typedef enum {
  // ES6 types (corresponds to typeof)
  napi_undefined,
  napi_null,
  napi_boolean,
  napi_number,
  napi_string,
  napi_symbol,
  napi_object,
  napi_function,
  napi_external,
} napi_valuetype;
```

Descrive il tipo di `napi_value`. Questo generalmente corrisponde ai tipi descritti nella [Section 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) dell'ECMAScript Language Specification. Oltre ai tipi in quella sezione, `napi_valuetype` può anche rappresentare delle `Function` e degli `Object` con dati esterni.

Un valore JavaScript di tipo `napi_external` viene visualizzato in JavaScript come un semplice object in modo tale che nessuna proprietà e nessun prototipo possano essere impostati su di esso.

#### napi_typedarray_type

```C
typedef enum {
  napi_int8_array,
  napi_uint8_array,
  napi_uint8_clamped_array,
  napi_int16_array,
  napi_uint16_array,
  napi_int32_array,
  napi_uint32_array,
  napi_float32_array,
  napi_float64_array,
} napi_typedarray_type;
```

Questo rappresenta il datatype scalare binario sottostante di `TypedArray`. Gli elementi di questa enum corrispondono alla [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/).

### Funzioni per la creazione di Objects

#### napi_create_array

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Array`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript `Array`. I JavaScript arrays sono descritti nella [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) dell'ECMAScript Language Specification.

#### napi_create_array_with_length

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: La lunghezza iniziale dell'`Array`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Array`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript `Array`. La proprietà della lunghezza dell'`Array` è impostata sul parametro della lunghezza passata/approvata. Tuttavia, il buffer sottostante non è garantito per essere pre-assegnato dalla VM quando viene creato l'array - tale comportamento viene lasciato all'implementazione della VM sottostante. Se il buffer deve essere un blocco contiguo di memoria che può essere letto e/o scritto direttamente tramite C, considerare l'utilizzo di [`napi_create_external_arraybuffer`][].

I JavaScript arrays sono descritti nella [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) dell'ECMAScript Language Specification.

#### napi_create_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: La lunghezza in bytes dell'array buffer da creare.
- `[out] data`: Puntatore al byte buffer sottostante di `ArrayBuffer`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript `ArrayBuffer`. Gli `ArrayBuffer` sono usati per rappresentare i buffers di dati binari a lunghezza fissa. Sono normalmente utilizzati come backing-buffer per gli `TypedArray` objects. L'`ArrayBuffer` allocato avrà un byte buffer sottostante la cui dimensione è determinata dal parametro `length` che è stato passato/approvato. Il buffer sottostante viene restituito in modo facoltativo al caller nel caso in cui il caller voglia manipolare direttamente il buffer. Questo buffer può essere scritto solo direttamente dal codice nativo. Per scrivere su questo buffer da JavaScript, è necessario creare un array tipizzato od un `DataView` object.

Gli JavaScript `ArrayBuffer` objects sono descritti nella [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) dell'ECMAScript Language Specification.

#### napi_create_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_buffer(napi_env env,
                               size_t size,
                               void** data,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] size`: Dimensione in bytes del buffer sottostante.
- `[out] data`: Puntatore Raw al buffer sottostante.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object. Mentre questa è ancora una struttura di dati completamente supportata, nella maggior parte dei casi sarà sufficiente utilizzare un `TypedArray`.

#### napi_create_buffer_copy

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_buffer_copy(napi_env env,
                                    size_t length,
                                    const void* data,
                                    void** result_data,
                                    napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] size`: Dimensione in bytes dell'input buffer (dovrebbe essere uguale alla dimensione del nuovo buffer).
- `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
- `[out] result_data`: Puntatore al buffer dei dati sottostanti del nuovo `Buffer`.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object e lo inizializza con i dati copiati dal buffer passato/approvato. Mentre questa è ancora una struttura di dati completamente supportata, nella maggior parte dei casi sarà sufficiente utilizzare un `TypedArray`.

#### napi_create_external

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_external(napi_env env,
                                 void* data,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] data`: Puntatore Raw ai dati esterni.
- `[in] finalize_cb`: Callback opzionale da chiamare quando viene raccolto il valore esterno.
- `[in] finalize_hint`: Hint opzionale da passare al callback finalizzato durante la raccolta.
- `[out] result`: Un `napi_value` che rappresenta un valore esterno.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un valore JavaScript con dati esterni associati ad esso. Questo è usato per passare dati esterni attraverso il codice JavaScript, quindi può essere recuperato in seguito dal codice nativo. L'API consente al caller di passare ad un callback finalizzato, nel caso in cui la risorsa nativa sottostante debba essere ripulita quando viene raccolto il valore JavaScript esterno.

Il valore creato non è un object, e pertanto non supporta proprietà aggiuntive. È considerato un tipo di valore distinto: chiamando `napi_typeof()` con un valore esterno produce `napi_external`.

#### napi_create_external_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status
napi_create_external_arraybuffer(napi_env env,
                                 void* external_data,
                                 size_t byte_length,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] external_data`: Puntatore al byte buffer sottostante dell'`ArrayBuffer`.
- `[in] byte_length`: La lunghezza in bytes del buffer sottostante.
- `[in] finalize_cb`: Callback opzionale da chiamare quando viene raccolto l'`ArrayBuffer`.
- `[in] finalize_hint`: Hint opzionale da passare al callback finalizzato durante la raccolta.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript `ArrayBuffer`. Il byte buffer sottostante dell'`ArrayBuffer` è allocato e gestito esternamente. Il caller deve assicurarsi che il byte buffer rimanga valido fino alla chiamata del callback finalizzato.

I JavaScript `ArrayBuffer` sono descritti nella [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) dell'ECMAScript Language Specification.

#### napi_create_external_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_external_buffer(napi_env env,
                                        size_t length,
                                        void* data,
                                        napi_finalize finalize_cb,
                                        void* finalize_hint,
                                        napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'APi.
- `[in] length`: Dimensione in bytes dell'input buffer (dovrebbe essere uguale alla dimensione del nuovo buffer).
- `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
- `[in] finalize_cb`: Callback opzionale da chiamare quando viene raccolto l'`ArrayBuffer`.
- `[in] finalize_hint`: Hint opzionale da passare al callback finalizzato durante la raccolta.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object e lo inizializza con i dati supportati dal buffer passato/approvato. Mentre questa è ancora una struttura di dati completamente supportata, nella maggior parte dei casi sarà sufficiente utilizzare un `TypedArray`.

Per Node.js >=4 i `Buffers` sono `Uint8Array`.

#### napi_create_function

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 size_t length,
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] utf8name`: Una stringa che rappresenta il nome della funzione codificata come UTF8.
- `[in] length`: La lunghezza di `utf8name` in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[in] cb`: Un funzione puntatore alla funzione nativa da invocare quando la funzione creata viene invocata da JavaScript.
- `[in] data`: Arbitrary context data opzionali da passare alla funzione nativa quando viene invocata.
- `[out] result`: Un `napi_value` che rappresenta una funzione JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un JavaScript `Function` object. È usata per avvolgere(wrap) le funzioni native in modo che possano essere invocate da JavaScript.

Le JavaScript `Function` sono descritte nella [Section 19.2](https://tc39.github.io/ecma262/#sec-function-objects) dell'ECMAScript Language Specification.

#### napi_create_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Object`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un JavaScript `Object` predefinito. È l'equivalente di fare `new Object()` in JavaScript.

Il tipo JavaScript `Object` è descritto nella [Section 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) dell'ECMAScript Language Specification.

#### napi_create_symbol

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] description`: `napi_value` opzionale che fa riferimento ad una JavaScript `String` da impostare come descrizione per il simbolo.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Symbol`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `Symbol` object da una stringa C con codifica UTF8.

Il tipo JavaScript `Symbol` è descritto nella [Section 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) dell'ECMAScript Language Specification.

#### napi_create_typedarray

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_typedarray(napi_env env,
                                   napi_typedarray_type type,
                                   size_t length,
                                   napi_value arraybuffer,
                                   size_t byte_offset,
                                   napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] type`: Datatype scalare degli elementi all'interno di `TypedArray`.
- `[in] length`: Numero di elementi in `TypedArray`.
- `[in] arraybuffer`: `ArrayBuffer` sottostante all'array tipizzato.
- `[in] byte_offset`: Il byte offset all'interno dell'`ArrayBuffer` da cui iniziare a proiettare il `TypedArray`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `TypedArray`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `TypedArray` object su un `ArrayBuffer` esistente. Gli `TypedArray` objects forniscono una visione simile all'array su un data buffer sottostante in cui ogni elemento ha lo stesso datatype scalare binario.

È richiesto che `(length * size_of_element) + byte_offset` debba essere <= della dimensione in bytes dell'array passato/approvato. In caso contrario, viene generata un'eccezione `RangeError`.

Gli JavaScript `TypedArray` objects sono descritti nella [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) dell'ECMAScript Language Specification.

#### napi_create_dataview

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_create_dataview(napi_env env,
                                 size_t byte_length,
                                 napi_value arraybuffer,
                                 size_t byte_offset,
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: Numero di elemtni in `DataView`.
- `[in] arraybuffer`: `ArrayBuffer` sottostante il `DataView`.
- `[in] byte_offset`: Il byte offset all'interno dell'`ArrayBuffer` da cui iniziare a proiettare il `DataView`.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `DataView` su un `ArrayBuffer` esistente. Gli `DataView` objects forniscono una visione simile all'array su un data buffer sottostante, ma uno che accetti elementi di dimensioni e tipo diversi nell'`ArrayBuffer`.

È richiesto che `byte_length + byte_offset` sia minore o uguale alla dimensione in bytes dell'array passato/approvato. In caso contrario, viene generata un'eccezione `RangeError`.

Gli JavaScript `DataView` objects sono descritti nella [Section 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) dell'ECMAScript Language Specification.

### Funzioni per la conversione da tipi C a N-API

#### napi_create_int32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore integer(intero) da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione dal tipo C `int32_t` al tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification.

#### napi_create_uint32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore unsigned integer da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione dal tipo C `uint32_t` al tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification.

#### napi_create_int64

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore integer da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione da tipo C `int64_t` a tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification. Nota che l'intervallo completo di `int64_t` non può essere rappresentato con la massima precisione in JavaScript. I valori integer al di fuori dell'intervallo di [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderanno precisione.

#### napi_create_double

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore double-precision(doppia precisione) da rappresentare in JavaScript.
- `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per la conversione del tipo C `double` al tipo JavaScript `Number`.

Il tipo JavaScript `Number` è descritto nella [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) dell'ECMAScript Language Specification.

#### napi_create_string_latin1

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_string_latin1(napi_env env,
                                      const char* str,
                                      size_t length,
                                      napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica ISO-8859-1.
- `[in] length`: La lunghezza della stringa in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `String` object da una stringa C con codifica ISO-8859-1. La stringa nativa viene copiata.

Il tipo JavaScript `String` è descritto nella [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) dell'ECMAScript Language Specification.

#### napi_create_string_utf16

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_string_utf16(napi_env env,
                                     const char16_t* str,
                                     size_t length,
                                     napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica UTF16-LE.
- `[in] length`: La lunghezza della stringa in two-byte code units, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `String` object da una stringa C con codifica UTF16-LE. La stringa nativa viene copiata.

Il tipo JavaScript `String` è descritto nella [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) dell'ECMAScript Language Specification.

#### napi_create_string_utf8

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_string_utf8(napi_env env,
                                    const char* str,
                                    size_t length,
                                    napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica UTF8.
- `[in] length`: La lunghezza della stringa in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
- `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript `String` object da una stringa C con codifica UTF8. La stringa nativa viene copiata.

Il tipo JavaScript `String` è descritto nella [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) dell'ECMAScript Language Specification.

### Funzioni per la conversione da N-API a tipi C

#### napi_get_array_length

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_array_length(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta il JavaScript `Array` di cui viene interrogata la lunghezza.
- `[out] result`: `uint32` che rappresenta la lunghezza dell'array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce la lunghezza di un'array.

La lunghezza dell'`Array` è descritta nella [Section 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) dell'ECMAScript Language Specification.

#### napi_get_arraybuffer_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] arraybuffer`: `napi_value` che rappresenta l'`ArrayBuffer` interrogato.
- `[out] data`: Il data buffer sottostante dell'`ArrayBuffer`.
- `[out] byte_length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per recuperare il data buffer sottostante di un `ArrayBuffer` e la sua lunghezza.

*WARNING*: Prestare attenzione durante l'utilizzo di quest'API. La durata del data buffer sottostante è gestita dall'`ArrayBuffer` anche dopo che viene restituito. Un possibile metodo sicuro per utilizzare quest'API è insieme a [`napi_create_reference`][], che può essere utilizzato per garantire il controllo della durata dell'`ArrayBuffer`. È anche sicuro utilizzare il data buffer restituito all'interno dello stesso callback fin quando non ci sono calls ad altre API che potrebbero attivare un GC.

#### napi_get_buffer_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_buffer_info(napi_env env,
                                 napi_value value,
                                 void** data,
                                 size_t* length)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta il `node::Buffer` interrogato.
- `[out] data`: Il data buffer sottostante al `node::Buffer`.
- `[out] length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per recuperare il data buffer sottostante di un `node::Buffer` e la sua lunghezza.

*Warning*: Prestare attenzione durante l'utilizzo di quest'API poiché la durata del data buffer sottostante non è garantita se è gestita dalla VM.

#### napi_get_prototype

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_prototype(napi_env env,
                               napi_value object,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: `napi_value` che rappresenta il JavaScript `Object` che deve restituire il prototipo. Questo restituisce l'equivalente di `Object.getPrototypeOf` (che non ha lo stesso ruolo della proprietà del `prototype` della funzione).
- `[out] result`: `napi_value` che rappresenta il prototipo dell'object dato.

Restituisce `napi_ok` se l'API ha esito positivo.

#### napi_get_typedarray_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_typedarray_info(napi_env env,
                                     napi_value typedarray,
                                     napi_typedarray_type* type,
                                     size_t* length,
                                     void** data,
                                     napi_value* arraybuffer,
                                     size_t* byte_offset)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] typedarray`: `napi_value` che rappresenta il `TypedArray` le cui proprietà sono da interrogare.
- `[out] type`: Datatype scalare degli elementi all'interno di `TypedArray`.
- `[out] length`: `Number` (numero) di elementi in `TypedArray`.
- `[out] data`: Il data buffer sottostante l'array tipizzato (typed array).
- `[out] byte_offset`: Il byte offset all'interno del data buffer da cui iniziare a proiettare il `TypedArray`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce varie proprietà di un array tipizzato (typed array).

*Warning*: Prestare attenzione durante l'utilizzo di quest'API poiché il data buffer sottostante è gestito dalla VM.

#### napi_get_dataview_info

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_get_dataview_info(napi_env env,
                                   napi_value dataview,
                                   size_t* byte_length,
                                   void** data,
                                   napi_value* arraybuffer,
                                   size_t* byte_offset)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] dataview`: `napi_value` che rappresenta il `DataView` le cui proprietà sono da interrogare.
- `[out] byte_length`: `Number` (numero) di bytes in `DataView`.
- `[out] data`: Il data buffer sottostante il `DataView`.
- `[out] arraybuffer`: `ArrayBuffer` sottostante il `DataView`.
- `[out] byte_offset`: Il byte offset all'interno del data buffer da cui iniziare a proiettare il `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce varie proprietà di un `DataView`.

#### napi_get_value_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Boolean`.
- `[out] result`: C booleano primitivo equivalente al JavaScript `Boolean` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non booleano esso restituisce `napi_boolean_expected`.

Quest'API restituisce un C booleano primitivo equivalente al JavaScript `Boolean` fornito.

#### napi_get_value_double

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_double(napi_env env,
                                  napi_value value,
                                  double* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C double primitivo equivalente al JavaScript `Number` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

Quest'API restituisce un C double primitivo equivalente al JavaScript `Number` fornito.

#### napi_get_value_external

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_external(napi_env env,
                                    napi_value value,
                                    void** result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un valore esterno di JavaScript.
- `[out] result`: Puntatore ai dati che hanno subito il wrapping da parte del valore esterno di JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non esterno esso restituisce `napi_invalid_arg`.

Quest'API recupera il puntatore ai dati esterni passato in precedenza a `napi_create_external()`.

#### napi_get_value_int32

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_int32(napi_env env,
                                 napi_value value,
                                 int32_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C `int32` primitivo equivalente al JavaScript `Number` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico in `napi_number_expected`.

Quest'API restituisce un C `int32` primitivo equivalente al JavaScript `Number` fornito.

Se il numero supera l'intervallo del valore integer a 32 bit, allora il risultato viene troncato all'equivalente dei 32 bits inferiori. Questo può determinare un numero positivo elevato che diventa un numero negativo se il valore è > 2^31 -1.

I valori numerici non finiti (`NaN`, `+Infinity`, oppure `-Infinity`) impostano il risultato su zero.

#### napi_get_value_int64

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_int64(napi_env env,
                                 napi_value value,
                                 int64_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C `int64` primitivo equivalente al JavaScript `Number` fornito.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

Quest'API restituisce un C `int64` primitivo equivalente al JavaScript `Number` fornito.

I valori `Number` (numerici) al di fuori dell'intervallo [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderanno precisione.

I valori numerici non finiti (`NaN`, `+Infinity`, oppure `-Infinity`) impostano il risultato su zero.

#### napi_get_value_string_latin1

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_latin1(napi_env env,
                                         napi_value value,
                                         char* buf,
                                         size_t bufsize,
                                         size_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica ISO-8859-1. Se viene passato NULL, viene restituita la lunghezza della stringa (in bytes).
- `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
- `[out] result`: Numero di bytes copiati all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` che non sia `String` esso restituisce `napi_string_expected`.

Quest'API restituisce la stringa con codifica ISO-8859-1 corrispondente al valore passato.

#### napi_get_value_string_utf8

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF8. Se viene passato NULL, viene restituita la lunghezza della stringa (in bytes).
- `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
- `[out] result`: Numero di bytes copiati all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` che non sia `String` esso restituisce `napi_string_expected`.

Quest'API restituisce la stringa con codifica UTF8 corrispondente al valore passato.

#### napi_get_value_string_utf16

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_utf16(napi_env env,
                                        napi_value value,
                                        char16_t* buf,
                                        size_t bufsize,
                                        size_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF16-LE. Se viene passato NULL, viene restituita la lunghezza della stringa (in unità di codice a 2 byte).
- `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
- `[out] result`: Numero di unità di codice a 2 byte copiate all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` che non sia `String` esso restituisce `napi_string_expected`.

Quest'API restituisce la stringa con codifica UTF16 corrispondente al valore passato.

#### napi_get_value_uint32

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_uint32(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un JavaScript `Number`.
- `[out] result`: C primitivo equivalente al `napi_value` fornito come un `uint32_t`.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

Quest'API restituisce un C primitivo equivalente al `napi_value` fornito come un `uint32_t`.

### Funzioni per ottenere istanze globali

#### napi_get_boolean

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore del booleano da recuperare.
- `[out] result`: `napi_value` che rappresenta un JavaScript `Boolean` singleton da recuperare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per restituire il JavaScript singleton object che viene utilizzato per rappresentare il valore booleano fornito.

#### napi_get_global

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta un JavaScript `global` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce il `global` object.

#### napi_get_null

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta un JavaScript `null` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce il `null` object.

#### napi_get_undefined

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta un valore JavaScript Undefined.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce l'Undefined object.

## Lavorare con i valori JavaScript - Abstract Operations

N-API espone un set di API per eseguire alcune abstract operations sui valori JavaScript. Alcune di queste operations sono documentate nella [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Queste API supportano una delle seguenti operations:

1. Forzare i valori JavaScript a specifici tipi JavaScript (come `Number` oppure `String`).
2. Controllare il tipo di un valore JavaScript.
3. Verificare l'uguaglianza tra due valori JavaScript.

### napi_coerce_to_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_bool(napi_env env,
                                napi_value value,
                                napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta il JavaScript `Boolean` forzato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToBoolean()` come definito nella [Section 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_coerce_to_number

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_number(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta il JavaScript `Number` forzato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToNumber()` come definito nella [Section 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_coerce_to_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_object(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta il JavaScript `Object` forzato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToObject()` come definito nella [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_coerce_to_string

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_string(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` che rappresenta la JavaScript `String` forzata.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API implementa l'abstract operation `ToString()` come definito nella [Section 7.1.13](https://tc39.github.io/ecma262/#sec-tostring) dell'ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'`Object` passato.

### napi_typeof

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript il cui tipo è da interrogare.
- `[out] result`: Il tipo del valore JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo.

- `napi_invalid_arg` se il tipo di `value` non è un tipo ECMAScript noto e se `value` non è un valore esterno.

Quest'API si comporta in modo simile all'invocazione del `typeof` Operator sull'object come definito nella [Section 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) dell'ECMAScript Language Specification. Tuttavia, ha il supporto per rilevare un valore esterno. Se `value` ha un tipo che non è valido, viene restituito un errore.

### napi_instanceof

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_instanceof(napi_env env,
                            napi_value object,
                            napi_value constructor,
                            bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[in] constructor`: Il JavaScript function object della funzione constructor da controllare.
- `[out] result`: Valore booleano impostato su true se `object instanceof constructor` è true.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API si comporta in modo simile all'invocazione del `instanceof` Operator sull'object come definito nella [Section 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) dell'ECMAScript Language Specification.

### napi_is_array

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[out] result`: Se l'object fornito è un array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API si comporta in modo simile all'invocazione del `IsArray` operation sull'object come definito nella [Section 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) dell'ECMAScript Language Specification.

### napi_is_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[out] result`: Se l'object fornito è un `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un array buffer.

### napi_is_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[out] result`: Se il `napi_value` fornito rappresenta un `node::Buffer` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un buffer.

### napi_is_error

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[out] result`: Se il `napi_value` fornito rappresenta un `Error` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'`Object` passato è un `Error`.

### napi_is_typedarray

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[out] result`: Se il `napi_value` fornito rappresenta un `TypedArray`.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in is a typed array.

### napi_is_dataview

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to check.
- `[out] result`: Whether the given `napi_value` represents a `DataView`.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in is a `DataView`.

### napi_strict_equals

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_strict_equals(napi_env env,
                               napi_value lhs,
                               napi_value rhs,
                               bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] lhs`: The JavaScript value to check.
- `[in] rhs`: The JavaScript value to check against.
- `[out] result`: Whether the two `napi_value` objects are equal.

Returns `napi_ok` if the API succeeded.

This API represents the invocation of the Strict Equality algorithm as defined in [Section 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) of the ECMAScript Language Specification.

## Working with JavaScript Properties

N-API exposes a set of APIs to get and set properties on JavaScript objects. Some of these types are documented under [Section 7](https://tc39.github.io/ecma262/#sec-operations-on-objects) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Properties in JavaScript are represented as a tuple of a key and a value. Fundamentally, all property keys in N-API can be represented in one of the following forms:

- Named: a simple UTF8-encoded string
- Integer-Indexed: an index value represented by `uint32_t`
- JavaScript value: these are represented in N-API by `napi_value`. This can be a `napi_value` representing a `String`, `Number`, or `Symbol`.

N-API values are represented by the type `napi_value`. Any N-API call that requires a JavaScript value takes in a `napi_value`. However, it's the caller's responsibility to make sure that the `napi_value` in question is of the JavaScript type expected by the API.

The APIs documented in this section provide a simple interface to get and set properties on arbitrary JavaScript objects represented by `napi_value`.

For instance, consider the following JavaScript code snippet:

```js
const obj = {};
obj.myProp = 123;
```

The equivalent can be done using N-API values with the following snippet:

```C
napi_status status = napi_generic_failure;

// const obj = {}
napi_value obj, value;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Create a napi_value for 123
status = napi_create_int32(env, 123, &value);
if (status != napi_ok) return status;

// obj.myProp = 123
status = napi_set_named_property(env, obj, "myProp", value);
if (status != napi_ok) return status;
```

Indexed properties can be set in a similar manner. Consider the following JavaScript snippet:

```js
const arr = [];
arr[123] = 'hello';
```

The equivalent can be done using N-API values with the following snippet:

```C
napi_status status = napi_generic_failure;

// const arr = [];
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// Create a napi_value for 'hello'
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &value);
if (status != napi_ok) return status;

// arr[123] = 'hello';
status = napi_set_element(env, arr, 123, value);
if (status != napi_ok) return status;
```

Properties can be retrieved using the APIs described in this section. Consider the following JavaScript snippet:

```js
const arr = [];
const value = arr[123];
```

The following is the approximate equivalent of the N-API counterpart:

```C
napi_status status = napi_generic_failure;

// const arr = []
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// const value = arr[123]
status = napi_get_element(env, arr, 123, &value);
if (status != napi_ok) return status;
```

Finally, multiple properties can also be defined on an object for performance reasons. Consider the following JavaScript:

```js
const obj = {};
Object.defineProperties(obj, {
  'foo': { value: 123, writable: true, configurable: true, enumerable: true },
  'bar': { value: 456, writable: true, configurable: true, enumerable: true }
});
```

The following is the approximate equivalent of the N-API counterpart:

```C
napi_status status = napi_status_generic_failure;

// const obj = {};
napi_value obj;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Create napi_values for 123 and 456
napi_value fooValue, barValue;
status = napi_create_int32(env, 123, &fooValue);
if (status != napi_ok) return status;
status = napi_create_int32(env, 456, &barValue);
if (status != napi_ok) return status;

// Set the properties
napi_property_descriptor descriptors[] = {
  { "foo", NULL, NULL, NULL, NULL, fooValue, napi_default, NULL },
  { "bar", NULL, NULL, NULL, NULL, barValue, napi_default, NULL }
}
status = napi_define_properties(env,
                                obj,
                                sizeof(descriptors) / sizeof(descriptors[0]),
                                descriptors);
if (status != napi_ok) return status;
```

### Structures

#### napi_property_attributes

```C
typedef enum {
  napi_default = 0,
  napi_writable = 1 << 0,
  napi_enumerable = 1 << 1,
  napi_configurable = 1 << 2,

  // Used with napi_define_class to distinguish static properties
  // from instance properties. Ignored by napi_define_properties.
  napi_static = 1 << 10,
} napi_property_attributes;
```

`napi_property_attributes` are flags used to control the behavior of properties set on a JavaScript object. Other than `napi_static` they correspond to the attributes listed in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/). They can be one or more of the following bitflags:

- `napi_default` - Used to indicate that no explicit attributes are set on the given property. By default, a property is read only, not enumerable and not configurable.
- `napi_writable` - Used to indicate that a given property is writable.
- `napi_enumerable` - Used to indicate that a given property is enumerable.
- `napi_configurable` - Used to indicate that a given property is configurable, as defined in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).
- `napi_static` - Used to indicate that the property will be defined as a static property on a class as opposed to an instance property, which is the default. This is used only by [`napi_define_class`][]. It is ignored by `napi_define_properties`.

#### napi_property_descriptor

```C
typedef struct {
  // One of utf8name or name should be NULL.
  const char* utf8name;
  napi_value name;

  napi_callback method;
  napi_callback getter;
  napi_callback setter;
  napi_value value;

  napi_property_attributes attributes;
  void* data;
} napi_property_descriptor;
```

- `utf8name`: Optional `String` describing the key for the property, encoded as UTF8. One of `utf8name` or `name` must be provided for the property.
- `name`: Optional `napi_value` that points to a JavaScript string or symbol to be used as the key for the property. One of `utf8name` or `name` must be provided for the property.
- `value`: The value that's retrieved by a get access of the property if the property is a data property. If this is passed in, set `getter`, `setter`, `method` and `data` to `NULL` (since these members won't be used).
- `getter`: A function to call when a get access of the property is performed. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is accessed from JavaScript code (or if a get on the property is performed using a N-API call).
- `setter`: A function to call when a set access of the property is performed. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is set from JavaScript code (or if a set on the property is performed using a N-API call).
- `method`: Set this to make the property descriptor object's `value` property to be a JavaScript function represented by `method`. If this is passed in, set `value`, `getter` and `setter` to `NULL` (since these members won't be used).
- `attributes`: The attributes associated with the particular property. See [`napi_property_attributes`](#n_api_napi_property_attributes).
- `data`: The callback data passed into `method`, `getter` and `setter` if this function is invoked.

### Functions

#### napi_get_property_names

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_property_names(napi_env env,
                                    napi_value object,
                                    napi_value* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the properties.
- `[out] result`: A `napi_value` representing an array of JavaScript values that represent the property names of the object. The API can be used to iterate over `result` using [`napi_get_array_length`][] and [`napi_get_element`][].

Returns `napi_ok` if the API succeeded.

This API returns the names of the enumerable properties of `object` as an array of strings. The properties of `object` whose key is a symbol will not be included.

#### napi_set_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_set_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value value);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object on which to set the property.
- `[in] key`: The name of the property to set.
- `[in] value`: The property value.

Returns `napi_ok` if the API succeeded.

This API set a property on the `Object` passed in.

#### napi_get_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the property.
- `[in] key`: The name of the property to retrieve.
- `[out] result`: The value of the property.

Returns `napi_ok` if the API succeeded.

This API gets the requested property from the `Object` passed in.

#### napi_has_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_has_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              bool* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] key`: The name of the property whose existence to check.
- `[out] result`: Whether the property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in has the named property.

#### napi_delete_property

<!-- YAML
added: v8.2.0
-->

```C
napi_status napi_delete_property(napi_env env,
                                 napi_value object,
                                 napi_value key,
                                 bool* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] key`: The name of the property to delete.
- `[out] result`: Whether the property deletion succeeded or not. `result` can optionally be ignored by passing `NULL`.

Returns `napi_ok` if the API succeeded.

This API attempts to delete the `key` own property from `object`.

#### napi_has_own_property

<!-- YAML
added: v8.2.0
-->

```C
napi_status napi_has_own_property(napi_env env,
                                  napi_value object,
                                  napi_value key,
                                  bool* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] key`: The name of the own property whose existence to check.
- `[out] result`: Whether the own property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in has the named own property. `key` must be a string or a `Symbol`, or an error will be thrown. N-API will not perform any conversion between data types.

#### napi_set_named_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_set_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    napi_value value);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object on which to set the property.
- `[in] utf8Name`: The name of the property to set.
- `[in] value`: The property value.

Returns `napi_ok` if the API succeeded.

This method is equivalent to calling [`napi_set_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

#### napi_get_named_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    napi_value* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the property.
- `[in] utf8Name`: The name of the property to get.
- `[out] result`: The value of the property.

Returns `napi_ok` if the API succeeded.

This method is equivalent to calling [`napi_get_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

#### napi_has_named_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_has_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    bool* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] utf8Name`: The name of the property whose existence to check.
- `[out] result`: Whether the property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This method is equivalent to calling [`napi_has_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

#### napi_set_element

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_set_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value value);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to set the properties.
- `[in] index`: The index of the property to set.
- `[in] value`: The property value.

Returns `napi_ok` if the API succeeded.

This API sets and element on the `Object` passed in.

#### napi_get_element

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the property.
- `[in] index`: The index of the property to get.
- `[out] result`: The value of the property.

Returns `napi_ok` if the API succeeded.

This API gets the element at the requested index.

#### napi_has_element

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_has_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             bool* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] index`: The index of the property whose existence to check.
- `[out] result`: Whether the property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This API returns if the `Object` passed in has an element at the requested index.

#### napi_delete_element

<!-- YAML
added: v8.2.0
-->

```C
napi_status napi_delete_element(napi_env env,
                                napi_value object,
                                uint32_t index,
                                bool* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] index`: The index of the property to delete.
- `[out] result`: Whether the element deletion succeeded or not. `result` can optionally be ignored by passing `NULL`.

Returns `napi_ok` if the API succeeded.

This API attempts to delete the specified `index` from `object`.

#### napi_define_properties

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_define_properties(napi_env env,
                                   napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the properties.
- `[in] property_count`: The number of elements in the `properties` array.
- `[in] properties`: The array of property descriptors.

Returns `napi_ok` if the API succeeded.

This method allows the efficient definition of multiple properties on a given object. The properties are defined using property descriptors (see [`napi_property_descriptor`][]). Given an array of such property descriptors, this API will set the properties on the object one at a time, as defined by `DefineOwnProperty()` (described in [Section 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) of the ECMA262 specification).

## Working with JavaScript Functions

N-API provides a set of APIs that allow JavaScript code to call back into native code. N-API APIs that support calling back into native code take in a callback functions represented by the `napi_callback` type. When the JavaScript VM calls back to native code, the `napi_callback` function provided is invoked. The APIs documented in this section allow the callback function to do the following:

- Get information about the context in which the callback was invoked.
- Get the arguments passed into the callback.
- Return a `napi_value` back from the callback.

Additionally, N-API provides a set of functions which allow calling JavaScript functions from native code. One can either call a function like a regular JavaScript function call, or as a constructor function.

### napi_call_function

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_call_function(napi_env env,
                               napi_value recv,
                               napi_value func,
                               int argc,
                               const napi_value* argv,
                               napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] recv`: The `this` object passed to the called function.
- `[in] func`: `napi_value` representing the JavaScript function to be invoked.
- `[in] argc`: The count of elements in the `argv` array.
- `[in] argv`: Array of `napi_values` representing JavaScript values passed in as arguments to the function.
- `[out] result`: `napi_value` representing the JavaScript object returned.

Returns `napi_ok` if the API succeeded.

This method allows a JavaScript function object to be called from a native add-on. This is the primary mechanism of calling back *from* the add-on's native code *into* JavaScript. For the special case of calling into JavaScript after an async operation, see [`napi_make_callback`][].

A sample use case might look as follows. Consider the following JavaScript snippet:

```js
function AddTwo(num) {
  return num + 2;
}
```

Then, the above function can be invoked from a native add-on using the following code:

```C
// Get the function named "AddTwo" on the global object
napi_value global, add_two, arg;
napi_status status = napi_get_global(env, &global);
if (status != napi_ok) return;

status = napi_get_named_property(env, global, "AddTwo", &add_two);
if (status != napi_ok) return;

// const arg = 1337
status = napi_create_int32(env, 1337, &arg);
if (status != napi_ok) return;

napi_value* argv = &arg;
size_t argc = 1;

// AddTwo(arg);
napi_value return_val;
status = napi_call_function(env, global, add_two, argc, argv, &return_val);
if (status != napi_ok) return;

// Convert the result back to a native type
int32_t result;
status = napi_get_value_int32(env, return_val, &result);
if (status != napi_ok) return;
```

### napi_create_function

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] utf8Name`: The name of the function encoded as UTF8. This is visible within JavaScript as the new function object's `name` property.
- `[in] cb`: The native function which should be called when this function object is invoked.
- `[in] data`: User-provided data context. This will be passed back into the function when invoked later.
- `[out] result`: `napi_value` representing the JavaScript function object for the newly created function.

Returns `napi_ok` if the API succeeded.

This API allows an add-on author to create a function object in native code. This is the primary mechanism to allow calling *into* the add-on's native code *from* JavaScript.

The newly created function is not automatically visible from script after this call. Instead, a property must be explicitly set on any object that is visible to JavaScript, in order for the function to be accessible from script.

In order to expose a function as part of the add-on's module exports, set the newly created function on the exports object. A sample module might look as follows:

```C
napi_value SayHello(napi_env env, napi_callback_info info) {
  printf("Hello\n");
  return NULL;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_status status;

  napi_value fn;
  status = napi_create_function(env, NULL, 0, SayHello, NULL, &fn);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "sayHello", fn);
  if (status != napi_ok) return NULL;

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

Given the above code, the add-on can be used from JavaScript as follows:

```js
const myaddon = require('./addon');
myaddon.sayHello();
```

The string passed to require is not necessarily the name passed into `NAPI_MODULE` in the earlier snippet but the name of the target in `binding.gyp` responsible for creating the `.node` file.

### napi_get_cb_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_cb_info(napi_env env,
                             napi_callback_info cbinfo,
                             size_t* argc,
                             napi_value* argv,
                             napi_value* thisArg,
                             void** data)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] cbinfo`: The callback info passed into the callback function.
- `[in-out] argc`: Specifies the size of the provided `argv` array and receives the actual count of arguments.
- `[out] argv`: Buffer to which the `napi_value` representing the arguments are copied. If there are more arguments than the provided count, only the requested number of arguments are copied. If there are fewer arguments provided than claimed, the rest of `argv` is filled with `napi_value` values that represent `undefined`.
- `[out] this`: Receives the JavaScript `this` argument for the call.
- `[out] data`: Receives the data pointer for the callback.

Returns `napi_ok` if the API succeeded.

This method is used within a callback function to retrieve details about the call like the arguments and the `this` pointer from a given callback info.

### napi_get_new_target

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] cbinfo`: The callback info passed into the callback function.
- `[out] result`: The `new.target` of the constructor call.

Returns `napi_ok` if the API succeeded.

This API returns the `new.target` of the constructor call. If the current callback is not a constructor call, the result is `NULL`.

### napi_new_instance

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_new_instance(napi_env env,
                              napi_value cons,
                              size_t argc,
                              napi_value* argv,
                              napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] cons`: `napi_value` representing the JavaScript function to be invoked as a constructor.
- `[in] argc`: The count of elements in the `argv` array.
- `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the constructor.
- `[out] result`: `napi_value` representing the JavaScript object returned, which in this case is the constructed object.

This method is used to instantiate a new JavaScript value using a given `napi_value` that represents the constructor for the object. For example, consider the following snippet:

```js
function MyObject(param) {
  this.param = param;
}

const arg = 'hello';
const value = new MyObject(arg);
```

The following can be approximated in N-API using the following snippet:

```C
// Get the constructor function MyObject
napi_value global, constructor, arg, value;
napi_status status = napi_get_global(env, &global);
if (status != napi_ok) return;

status = napi_get_named_property(env, global, "MyObject", &constructor);
if (status != napi_ok) return;

// const arg = "hello"
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &arg);
if (status != napi_ok) return;

napi_value* argv = &arg;
size_t argc = 1;

// const value = new MyObject(arg)
status = napi_new_instance(env, constructor, argc, argv, &value);
```

Returns `napi_ok` if the API succeeded.

## Object Wrap

N-API offers a way to "wrap" C++ classes and instances so that the class constructor and methods can be called from JavaScript.

1. The [`napi_define_class`][] API defines a JavaScript class with constructor, static properties and methods, and instance properties and methods that correspond to the C++ class.
2. When JavaScript code invokes the constructor, the constructor callback uses [`napi_wrap`][] to wrap a new C++ instance in a JavaScript object, then returns the wrapper object.
3. When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` C++ function is invoked. For an instance callback, [`napi_unwrap`][] obtains the C++ instance that is the target of the call.

For wrapped objects it may be difficult to distinguish between a function called on a class prototype and a function called on an instance of a class. A common pattern used to address this problem is to save a persistent reference to the class constructor for later `instanceof` checks.

As an example:

```C
napi_value MyClass_constructor = NULL;
status = napi_get_reference_value(env, MyClass::es_constructor, &MyClass_constructor);
assert(napi_ok == status);
bool is_instance = false;
status = napi_instanceof(env, es_this, MyClass_constructor, &is_instance);
assert(napi_ok == status);
if (is_instance) {
  // napi_unwrap() ...
} else {
  // otherwise...
}
```

The reference must be freed once it is no longer needed.

### napi_define_class

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_define_class(napi_env env,
                              const char* utf8name,
                              size_t length,
                              napi_callback constructor,
                              void* data,
                              size_t property_count,
                              const napi_property_descriptor* properties,
                              napi_value* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] utf8name`: Name of the JavaScript constructor function; this is not required to be the same as the C++ class name, though it is recommended for clarity.
- `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[in] constructor`: Callback function that handles constructing instances of the class. (This should be a static method on the class, not an actual C++ constructor function.)
- `[in] data`: Optional data to be passed to the constructor callback as the `data` property of the callback info.
- `[in] property_count`: Number of items in the `properties` array argument.
- `[in] properties`: Array of property descriptors describing static and instance data properties, accessors, and methods on the class See `napi_property_descriptor`.
- `[out] result`: A `napi_value` representing the constructor function for the class.

Returns `napi_ok` if the API succeeded.

Defines a JavaScript class that corresponds to a C++ class, including:

- A JavaScript constructor function that has the class name and invokes the provided C++ constructor callback.
- Properties on the constructor function corresponding to *static* data properties, accessors, and methods of the C++ class (defined by property descriptors with the `napi_static` attribute).
- Properties on the constructor function's `prototype` object corresponding to *non-static* data properties, accessors, and methods of the C++ class (defined by property descriptors without the `napi_static` attribute).

The C++ constructor callback should be a static method on the class that calls the actual class constructor, then wraps the new C++ instance in a JavaScript object, and returns the wrapper object. See `napi_wrap()` for details.

The JavaScript constructor function returned from [`napi_define_class`][] is often saved and used later, to construct new instances of the class from native code, and/or check whether provided values are instances of the class. In that case, to prevent the function value from being garbage-collected, create a persistent reference to it using [`napi_create_reference`][] and ensure the reference count is kept >= 1.

### napi_wrap

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_wrap(napi_env env,
                      napi_value js_object,
                      void* native_object,
                      napi_finalize finalize_cb,
                      void* finalize_hint,
                      napi_ref* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] js_object`: The JavaScript object that will be the wrapper for the native object. This object *must* have been created from the `prototype` of a constructor that was created using `napi_define_class()`.
- `[in] native_object`: The native instance that will be wrapped in the JavaScript object.
- `[in] finalize_cb`: Optional native callback that can be used to free the native instance when the JavaScript object is ready for garbage-collection.
- `[in] finalize_hint`: Optional contextual hint that is passed to the finalize callback.
- `[out] result`: Optional reference to the wrapped object.

Returns `napi_ok` if the API succeeded.

Wraps a native instance in a JavaScript object. The native instance can be retrieved later using `napi_unwrap()`.

When JavaScript code invokes a constructor for a class that was defined using `napi_define_class()`, the `napi_callback` for the constructor is invoked. After constructing an instance of the native class, the callback must then call `napi_wrap()` to wrap the newly constructed instance in the already-created JavaScript object that is the `this` argument to the constructor callback. (That `this` object was created from the constructor function's `prototype`, so it already has definitions of all the instance properties and methods.)

Typically when wrapping a class instance, a finalize callback should be provided that simply deletes the native instance that is received as the `data` argument to the finalize callback.

The optional returned reference is initially a weak reference, meaning it has a reference count of 0. Typically this reference count would be incremented temporarily during async operations that require the instance to remain valid.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. (If it is deleted before then, then the finalize callback may never be invoked.) Therefore, when obtaining a reference a finalize callback is also required in order to enable correct proper of the reference.

This API may modify the prototype chain of the wrapper object. Afterward, additional manipulation of the wrapper's prototype chain may cause `napi_unwrap()` to fail.

Calling `napi_wrap()` a second time on an object will return an error. To associate another native instance with the object, use `napi_remove_wrap()` first.

### napi_unwrap

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_unwrap(napi_env env,
                        napi_value js_object,
                        void** result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] js_object`: The object associated with the native instance.
- `[out] result`: Pointer to the wrapped native instance.

Returns `napi_ok` if the API succeeded.

Retrieves a native instance that was previously wrapped in a JavaScript object using `napi_wrap()`.

When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` is invoked. If the callback is for an instance method or accessor, then the `this` argument to the callback is the wrapper object; the wrapped C++ instance that is the target of the call can be obtained then by calling `napi_unwrap()` on the wrapper object.

### napi_remove_wrap

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_remove_wrap(napi_env env,
                             napi_value js_object,
                             void** result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] js_object`: The object associated with the native instance.
- `[out] result`: Pointer to the wrapped native instance.

Returns `napi_ok` if the API succeeded.

Retrieves a native instance that was previously wrapped in the JavaScript object `js_object` using `napi_wrap()` and removes the wrapping, thereby restoring the JavaScript object's prototype chain. If a finalize callback was associated with the wrapping, it will no longer be called when the JavaScript object becomes garbage-collected.

## Simple Asynchronous Operations

Addon modules often need to leverage async helpers from libuv as part of their implementation. This allows them to schedule work to be executed asynchronously so that their methods can return in advance of the work being completed. This is important in order to allow them to avoid blocking overall execution of the Node.js application.

N-API provides an ABI-stable interface for these supporting functions which covers the most common asynchronous use cases.

N-API defines the `napi_work` structure which is used to manage asynchronous workers. Instances are created/deleted with [`napi_create_async_work`][] and [`napi_delete_async_work`][].

The `execute` and `complete` callbacks are functions that will be invoked when the executor is ready to execute and when it completes its task respectively. These functions implement the following interfaces:

```C
typedef void (*napi_async_execute_callback)(napi_env env,
                                            void* data);
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

When these methods are invoked, the `data` parameter passed will be the addon-provided `void*` data that was passed into the `napi_create_async_work` call.

Once created the async worker can be queued for execution using the [`napi_queue_async_work`][] function:

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

[`napi_cancel_async_work`][] can be used if the work needs to be cancelled before the work has started execution.

After calling [`napi_cancel_async_work`][], the `complete` callback will be invoked with a status value of `napi_cancelled`. The work should not be deleted before the `complete` callback invocation, even when it was cancelled.

### napi_create_async_work

<!-- YAML
added: v8.0.0
changes:

  - version: v8.6.0
    pr-url: https://github.com/nodejs/node/pull/14697
    description: Added `async_resource` and `async_resource_name` parameters.
-->

```C
napi_status napi_create_async_work(napi_env env,
                                   napi_value async_resource,
                                   napi_value async_resource_name,
                                   napi_async_execute_callback execute,
                                   napi_async_complete_callback complete,
                                   void* data,
                                   napi_async_work* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[in] execute`: The native function which should be called to execute the logic asynchronously. The given function is called from a worker pool thread and can execute in parallel with the main event loop thread.
- `[in] complete`: The native function which will be called when the asynchronous logic is completed or is cancelled. The given function is called from the main event loop thread.
- `[in] data`: User-provided data context. This will be passed back into the execute and complete functions.
- `[out] result`: `napi_async_work*` which is the handle to the newly created async work.

Returns `napi_ok` if the API succeeded.

This API allocates a work object that is used to execute logic asynchronously. It should be freed using [`napi_delete_async_work`][] once the work is no longer required.

`async_resource_name` should be a null-terminated, UTF-8-encoded string.

The `async_resource_name` identifier is provided by the user and should be representative of the type of async work being performed. It is also recommended to apply namespacing to the identifier, e.g. by including the module name. See the [`async_hooks` documentation][async_hooks `type`] for more information.

### napi_delete_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_delete_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

Returns `napi_ok` if the API succeeded.

This API frees a previously allocated work object.

This API can be called even if there is a pending JavaScript exception.

### napi_queue_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

Returns `napi_ok` if the API succeeded.

This API requests that the previously allocated work be scheduled for execution.

### napi_cancel_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

Returns `napi_ok` if the API succeeded.

This API cancels queued work if it has not yet been started. If it has already started executing, it cannot be cancelled and `napi_generic_failure` will be returned. If successful, the `complete` callback will be invoked with a status value of `napi_cancelled`. The work should not be deleted before the `complete` callback invocation, even if it has been successfully cancelled.

This API can be called even if there is a pending JavaScript exception.

## Custom Asynchronous Operations

The simple asynchronous work APIs above may not be appropriate for every scenario. When using any other asynchronous mechanism, the following APIs are necessary to ensure an asynchronous operation is properly tracked by the runtime.

### napi_async_init

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_async_init(napi_env env,
                            napi_value async_resource,
                            napi_value async_resource_name,
                            napi_async_context* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[out] result`: The initialized async context.

Returns `napi_ok` if the API succeeded.

### napi_async_destroy

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] async_context`: The async context to be destroyed.

Returns `napi_ok` if the API succeeded.

This API can be called even if there is a pending JavaScript exception.

### napi_make_callback

<!-- YAML
added: v8.0.0
changes:

  - version: v8.6.0
    description: Added `async_context` parameter.
-->

```C
napi_status napi_make_callback(napi_env env,
                               napi_async_context async_context,
                               napi_value recv,
                               napi_value func,
                               int argc,
                               const napi_value* argv,
                               napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
- `[in] recv`: The `this` object passed to the called function.
- `[in] func`: `napi_value` representing the JavaScript function to be invoked.
- `[in] argc`: The count of elements in the `argv` array.
- `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the function.
- `[out] result`: `napi_value` representing the JavaScript object returned.

Returns `napi_ok` if the API succeeded.

This method allows a JavaScript function object to be called from a native add-on. This API is similar to `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). It is a fairly simple wrapper around `node::MakeCallback`.

Note it is *not* necessary to use `napi_make_callback` from within a `napi_async_complete_callback`; in that situation the callback's async context has already been set up, so a direct call to `napi_call_function` is sufficient and appropriate. Use of the `napi_make_callback` function may be required when implementing custom async behavior that does not use `napi_create_async_work`.

### napi_open_callback_scope

<!-- YAML
added: v9.6.0
-->

```C
NAPI_EXTERN napi_status napi_open_callback_scope(napi_env env,
                                                 napi_value resource_object,
                                                 napi_async_context context,
                                                 napi_callback_scope* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] resource_object`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] context`: Context for the async operation that is invoking the callback. This should be a value previously obtained from [`napi_async_init`][].
- `[out] result`: The newly created scope.

There are cases (for example resolving promises) where it is necessary to have the equivalent of the scope associated with a callback in place when making certain N-API calls. If there is no other script on the stack the [`napi_open_callback_scope`][] and [`napi_close_callback_scope`][] functions can be used to open/close the required scope.

### napi_close_callback_scope

<!-- YAML
added: v9.6.0
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] scope`: The scope to be closed.

This API can be called even if there is a pending JavaScript exception.

## Version Management

### napi_get_node_version

<!-- YAML
added: v8.4.0
-->

```C
typedef struct {
  uint32_t major;
  uint32_t minor;
  uint32_t patch;
  const char* release;
} napi_node_version;

napi_status napi_get_node_version(napi_env env,
                                  const napi_node_version** version);
```

- `[in] env`: The environment that the API is invoked under.
- `[out] version`: A pointer to version information for Node.js itself.

Returns `napi_ok` if the API succeeded.

This function fills the `version` struct with the major, minor, and patch version of Node.js that is currently running, and the `release` field with the value of [`process.release.name`][`process.release`].

The returned buffer is statically allocated and does not need to be freed.

### napi_get_version

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_version(napi_env env,
                             uint32_t* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[out] result`: The highest version of N-API supported.

Returns `napi_ok` if the API succeeded.

This API returns the highest N-API version supported by the Node.js runtime. N-API is planned to be additive such that newer releases of Node.js may support additional API functions. In order to allow an addon to use a newer function when running with versions of Node.js that support it, while providing fallback behavior when running with Node.js versions that don't support it:

- Call `napi_get_version()` to determine if the API is available.
- If available, dynamically load a pointer to the function using `uv_dlsym()`.
- Use the dynamically loaded pointer to invoke the function.
- If the function is not available, provide an alternate implementation that does not use the function.

## Memory Management

### napi_adjust_external_memory

<!-- YAML
added: v8.5.0
-->

```C
NAPI_EXTERN napi_status napi_adjust_external_memory(napi_env env,
                                                    int64_t change_in_bytes,
                                                    int64_t* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] change_in_bytes`: The change in externally allocated memory that is kept alive by JavaScript objects.
- `[out] result`: The adjusted value

Returns `napi_ok` if the API succeeded.

This function gives V8 an indication of the amount of externally allocated memory that is kept alive by JavaScript objects (i.e. a JavaScript object that points to its own memory allocated by a native module). Registering externally allocated memory will trigger global garbage collections more often than it would otherwise.

<!-- it's very convenient to have all the anchors indexed -->

<!--lint disable no-unused-definitions remark-lint-->

## Promises

N-API provides facilities for creating `Promise` objects as described in [Section 25.4](https://tc39.github.io/ecma262/#sec-promise-objects) of the ECMA specification. It implements promises as a pair of objects. When a promise is created by `napi_create_promise()`, a "deferred" object is created and returned alongside the `Promise`. The deferred object is bound to the created `Promise` and is the only means to resolve or reject the `Promise` using `napi_resolve_deferred()` or `napi_reject_deferred()`. The deferred object that is created by `napi_create_promise()` is freed by `napi_resolve_deferred()` or `napi_reject_deferred()`. The `Promise` object may be returned to JavaScript where it can be used in the usual fashion.

For example, to create a promise and pass it to an asynchronous worker:

```c
napi_deferred deferred;
napi_value promise;
napi_status status;

// Create the promise.
status = napi_create_promise(env, &deferred, &promise);
if (status != napi_ok) return NULL;

// Pass the deferred to a function that performs an asynchronous action.
do_something_asynchronous(deferred);

// Return the promise to JS
return promise;
```

The above function `do_something_asynchronous()` would perform its asynchronous action and then it would resolve or reject the deferred, thereby concluding the promise and freeing the deferred:

```c
napi_deferred deferred;
napi_value undefined;
napi_status status;

// Create a value with which to conclude the deferred.
status = napi_get_undefined(env, &undefined);
if (status != napi_ok) return NULL;

// Resolve or reject the promise associated with the deferred depending on
// whether the asynchronous action succeeded.
if (asynchronous_action_succeeded) {
  status = napi_resolve_deferred(env, deferred, undefined);
} else {
  status = napi_reject_deferred(env, deferred, undefined);
}
if (status != napi_ok) return NULL;

// At this point the deferred has been freed, so we should assign NULL to it.
deferred = NULL;
```

### napi_create_promise

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_create_promise(napi_env env,
                                napi_deferred* deferred,
                                napi_value* promise);
```

- `[in] env`: The environment that the API is invoked under.
- `[out] deferred`: A newly created deferred object which can later be passed to `napi_resolve_deferred()` or `napi_reject_deferred()` to resolve resp. reject the associated promise.
- `[out] promise`: The JavaScript promise associated with the deferred object.

Returns `napi_ok` if the API succeeded.

This API creates a deferred object and a JavaScript promise.

### napi_resolve_deferred

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_resolve_deferred(napi_env env,
                                  napi_deferred deferred,
                                  napi_value resolution);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] deferred`: The deferred object whose associated promise to resolve.
- `[in] resolution`: The value with which to resolve the promise.

This API resolves a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to resolve JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

The deferred object is freed upon successful completion.

### napi_reject_deferred

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_reject_deferred(napi_env env,
                                 napi_deferred deferred,
                                 napi_value rejection);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] deferred`: The deferred object whose associated promise to resolve.
- `[in] rejection`: The value with which to reject the promise.

This API rejects a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to reject JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

The deferred object is freed upon successful completion.

### napi_is_promise

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_is_promise(napi_env env,
                            napi_value promise,
                            bool* is_promise);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] promise`: The promise to examine
- `[out] is_promise`: Flag indicating whether `promise` is a native promise object - that is, a promise object created by the underlying engine.

## Script execution

N-API provides an API for executing a string containing JavaScript using the underlying JavaScript engine.

### napi_run_script

<!-- YAML
added: v8.5.0
-->

```C
NAPI_EXTERN napi_status napi_run_script(napi_env env,
                                        napi_value script,
                                        napi_value* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] script`: A JavaScript string containing the script to execute.
- `[out] result`: The value resulting from having executed the script.

## libuv event loop

N-API provides a function for getting the current event loop associated with a specific `napi_env`.

### napi_get_uv_event_loop

<!-- YAML
added: v9.3.0
-->

```C
NAPI_EXTERN napi_status napi_get_uv_event_loop(napi_env env,
                                               uv_loop_t** loop);
```

- `[in] env`: The environment that the API is invoked under.
- `[out] loop`: The current libuv loop instance.