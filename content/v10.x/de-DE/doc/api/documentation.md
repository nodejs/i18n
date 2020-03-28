# Über diese Dokumentation

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Das Ziel dieser Dokumentation ist es, die Node.js API umfassend zu erklären, sowohl aus Referenz- als auch aus konzeptioneller Sicht. Jeder Abschnitt beschreibt ein eingebautes Modul oder ein Konzept auf hohem Niveau.

Where appropriate, property types, method arguments, and the arguments provided to event handlers are detailed in a list underneath the topic heading.

## Mitwirken

Wenn in dieser Dokumentation Fehler gefunden werden, senden Sie bitte [ein Problem ein](https://github.com/nodejs/node/issues/new) oder lesen Sie [den Beitrag Anleitung](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) für Anleitungen, wie Sie einen Patch einreichen können.

Jede Datei wird basierend auf der entsprechenden `.md` Datei im Ordner `doc/api/` im Quellbaum von Node.js generiert. Die Dokumentation wird mit dem `tools/doc/generate.js` Programm generiert. Eine HTML-Vorlage befindet sich unter `doc/template.html`.

## Stabilitätsindex

<!--type=misc-->

Überall in der Dokumentation zeigt die Stabilität eines Abschnitts an. Die Node.js API ändert sich immer noch einigermaßen und da sie reift, sind bestimmte Teile zuverlässiger als andere. Einige sind so bewiesen und sind so darauf angewiesen, dass sie sich nicht jemals bei ändern werden. Andere sind nagelneu und experimentell, oder bekannt als gefährlich und im Prozess der Neugestaltung.

Die Stabilitätsindizes lauten wie folgt:

> Stabilität: 0 - Veraltet. The feature may emit warnings. Backward compatibility is not guaranteed.

<!-- separator -->

> Stabilität: 1 - Experimentell. This feature is still under active development and subject to non-backward compatible changes or removal in any future version. Die Verwendung der Funktion wird in Produktionsumgebungen nicht empfohlen. Experimental features are not subject to the Node.js Semantic Versioning model.

<!-- separator -->

> Stabilität: 2 - Stabil. Compatibility with the npm ecosystem is a high priority.

Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. Endbenutzer können nicht wissen, dass experimentelle Funktionen verwendet werden und kann daher zu unerwarteten Fehlern oder Verhaltensänderungen beim Auftreten von API-Änderungen führen. Um solche Überraschungen zu vermeiden, könnten `Experimental` Features ein Befehlszeilenflag erfordern, um diese explizit zu aktivieren oder kann eine Prozesswarnung auslösen. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`'warning'`][] event.

## JSON Ausgabe

<!-- YAML
added: v0.6.12
-->

> Stabilität: 1 - Experimentell

Jedes `.html` Dokument hat ein passendes `.json` Dokument, dass die selben Informationen in einen strukturierten Verhalten. Diese Funktion ist experimentell und zum Nutzen von IDEs und anderen Hilfsprogrammen hinzugefügt, die programmatische Dinge mit der Dokumentation erledigen möchten.

## Syscalls und Man Seiten

Systemaufrufe wie open(2) und read(2) definieren die Schnittstelle zwischen Benutzerprogrammen und dem zugrundeliegenden Betriebssystem. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. Die Dokumentation verlinkt auf den entsprechenden Man Seiten (kurz für manuelle Seiten), die beschreiben, wie die Syscalls funktionieren.

Die meisten Unix Syscalls haben Windows-Äquivalente, aber das Verhalten kann unter Windows relativ zu Linux und macOS variieren. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).