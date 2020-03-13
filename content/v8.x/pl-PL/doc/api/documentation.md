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
Stability: 0 - Deprecated
This feature is known to be problematic, and changes may be planned. Do
not rely on it. Use of the feature may cause warnings to be emitted.
Nie należy się spodziewać wstecznej kompatybilności z podstawowymi wersjami.
```

```txt
Stability: 1 - Experimental
This feature is still under active development and subject to non-backwards
compatible changes, or even removal, in any future version. Use of the feature
is not recommended in production environments. Experimental features are not
subject to the Node.js Semantic Versioning model.
```

```txt
Stability: 2 - Stable
The API has proven satisfactory. Compatibility with the npm ecosystem
is a high priority, and will not be broken unless absolutely necessary.
```

*Note*: Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. Końcowi odbiorcy mogą nie być tego świadomi, że używane są funkcje eksperymentalne, dlatego mogą wystąpić nieoczekiwane awarie lub zmiany zachowań po wystąpieniu modyfikacji interfejsu API. Aby tego uniknąć tego typu niespodzianki, funkcje `Eksperymentalne` mogą wymagać użycia wiersza polecenia flagi do jawnego ich uruchomienia, lub mogą powodować wyświetlenia ostrzeżenia o procesie. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`process.on('warning')`][] event.

## Dane wyjściowe JSON
<!-- YAML
added: v0.6.12
-->

> Stabilność: 1 - Eksperymentalne

Każdy dokument `.html` zawiera odpowiedni dokument `.json` przedstawiający te same informacje w uporządkowany sposób. This feature is experimental, and added for the benefit of IDEs and other utilities that wish to do programmatic things with the documentation.

## Funkcje systemowe i strony podręcznika systemowego

Funkcje systemowe, takie jak open(2) i read(2), definiują interfejs między programami użytkownika i bazowym systemem operacyjnym. Node functions which simply wrap a syscall, like [`fs.open()`][], will document that. Dokumenty prowadzą do odpowiedniej strony podręcznika, które opisują sposób działania funkcji systemowych.

Niektóre funkcje systemowe, takie jak Ichown(2), są specyficzne dla BSD. That means, for example, that [`fs.lchown()`][] only works on macOS and other BSD-derived systems, and is not available on Linux.

Większość uniksowych funkcji systemowych ma odpowiedniki Windowsa, ale zachowanie może się różnić w Windowsie względem systemu Linux i macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
