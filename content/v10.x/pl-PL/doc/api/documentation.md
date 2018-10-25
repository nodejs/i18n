# O dokumentacji

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Celem tej dokumentacji jest wyczerpujące wyjaśnienie Node.js API, zarówno z definicji jak i koncepcyjnego punktu widzenia. Each section describes a built-in module or high-level concept.

W razie potrzeby typy właściwości, argumenty metody i argumenty dostarczone do programów obsługujących zdarzenia, które są szczegółowo opisane na liście pod tematem nagłówek.

## Współtworzenie

Jeżeli znajdziesz błąd w tej dokumentacji, proszę [wyślij zgłoszenie](https://github.com/nodejs/node/issues/new) lub przeczytaj [instrukcję współtworzenia](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md), która opisuje wskazówki oraz sposób dodawania poprawek.

Każdy plik jest generowany na podstawie odpowiadającego pliku `.md` w folderze `doc/api/` w drzewie źródłowym Node.js. Dokumentacja jest generowana przy użyciu programu `tools/doc/generate.js`. Szablon HTML znajduje się na `doc/template.html`.

## Stability Index

<!--type=misc-->

Throughout the documentation are indications of a section's stability. Interfejs API Node.js wciąż nieco się zmienia i w ten sposób dojrzewa, niektóre części są bardziej niezawodne niż inne. Niektóre są tak wypróbowane, że można polegać na tym, że prawdopodobnie wcale się nie zmienią. Inne są zupełnie nowe i eksperymentalne lub znane jako ryzykowne i w trakcie przeprojektowywania.

Wskaźniki stabilności są następujące:

```txt
Stabilność: 0 - Przestarzałe. Ta funkcja jest znana jako problematyczna i mogą być
planowane zmiany. Nie polegaj na niej. Użycie tej funkcji może spowodować pojawienie się
ostrzeżeń. Backwards compatibility across major versions should not be expected.
```

```txt
Stability: 1 - Experimental. This feature is still under active development and
subject to non-backwards compatible changes, or even removal, in any future
version. Use of the feature is not recommended in production environments.
Experimental features are not subject to the Node.js Semantic Versioning model.
```

```txt
Stability: 2 - Stable. The API has proven satisfactory. Compatibility with the
npm ecosystem is a high priority, and will not be broken unless absolutely
necessary.
```

Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. End users may not be aware that experimental features are being used, and therefore may experience unexpected failures or behavior changes when API modifications occur. To help avoid such surprises, `Experimental` features may require a command-line flag to explicitly enable them, or may cause a process warning to be emitted. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`'warning'`][] event.

## JSON Output

<!-- YAML
added: v0.6.12
-->

> Stabilność: 1 - Eksperymentalne

Every `.html` document has a corresponding `.json` document presenting the same information in a structured manner. This feature is experimental, and added for the benefit of IDEs and other utilities that wish to do programmatic things with the documentation.

## Syscalls and man pages

System calls like open(2) and read(2) define the interface between user programs and the underlying operating system. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. The docs link to the corresponding man pages (short for manual pages) which describe how the syscalls work.

Some syscalls, like lchown(2), are BSD-specific. That means, for example, that [`fs.lchown()`][] only works on macOS and other BSD-derived systems, and is not available on Linux.

Most Unix syscalls have Windows equivalents, but behavior may differ on Windows relative to Linux and macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node issue 4760](https://github.com/nodejs/node/issues/4760).