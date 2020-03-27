# À propos de cette documentation

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

L'objectif de cette documentation est d'expliquer de manière exhaustive l'API Node.js, tant d'un point de vue référenciel que conceptuel. Chaque section décrit un module intégré ou un concept de haut niveau.

Lorsque approprié, les type de propriétés, les arguments de méthodes et les arguments fournis aux gestionnaires d'événements sont détaillés dans une liste sous l'entête du sujet.

## Contribuer

Si des erreurs sont trouvées dans cette documentation, veuillez [ouvrir une issue](https://github.com/nodejs/node/issues/new) ou regarder [le guide de contribution](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) afin d'obtenir des instructions sur la façon de soumettre un correctif.

Chaque fichier est généré en fonction du fichier `.md` correspondant dans le dossier `doc/api/` source de Node.js. La documentation est générée en utilisant le programme `tools/doc/generate.js` . Un modèle HTML est situé dans `doc/template.html`.

## Indice de stabilité

<!--type=misc-->

Tout au long de la documentation se trouvent des indications sur la stabilité d'une section. L'API Node.js continue à évoluer et pendant cette phase de maturité certaines parties sont plus fiables que d'autres. Certaines sont tellement fiables et éprouvées qu'il est peut probable qu'elles changent à nouveau. D'autres sont toutes neuves et expérimentales ou ne sont pas réputée pour être fiable et sont en cours de refonte.

Les indices de stabilité sont les suivants :

> Stabilité : 0 - Obsolète. The feature may emit warnings. Backward compatibility is not guaranteed.

<!-- separator -->

> Stability: 1 - Experimental. This feature is still under active development and subject to non-backward compatible changes or removal in any future version. Use of the feature is not recommended in production environments. Experimental features are not subject to the Node.js Semantic Versioning model.

<!-- separator -->

> Stability: 2 - Stable. Compatibility with the npm ecosystem is a high priority.

Il faut faire preuve de prudence lors de l'utilisation de fonctionnalités `expérimentales`, en particulier dans les modules qui peuvent être utilisés comme dépendances (ou dépendances de dépendances) dans une application Node.js. Les utilisateurs finaux ne sont peut-être pas au courant de l'utilisation des fonctionnalités expérimentales et risquent donc des erreurs ou changements de comportements inattendus lorsque des modifications de l'API ont lieu. Afin d'éviter de telles surprises, les fonctionnalités `Expérimentales` peuvent nécessiter une option de ligne de commande afin de les activer explicitement ou peuvent émettre des messages d'avertissement. Par défaut ces messages d'avertissements sont envoyés sur [`stderr`][] et peuvent être gérés en attachant un écouteur sur l'événement d'[`avertissement`][].

## Format JSON
<!-- YAML
added: v0.6.12
-->

> Stabilité: 1 - Expérimental

Chaque document `.html` a un document `.json` correspondant présentant les mêmes informations de manière structurée. Cette fonctionnalité est expérimentale et est ajoutée au bénéfice des IDEs et d'autres utilitaires qui souhaite utiliser la documentation de manière programmatique.

## Appels systèmes et pages de manuel

Les appels système tels que open(2) et read(2) définissent l'interface entre les programmes utilisateur et le système d'exploitation sous-jacent. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. La documentation est liée aux pages de manuel qui décrivent comment l'appel système fonctionne.

La majorité des appels systèmes Unix ont un équivalent Windows, mais le comportement sur Windows peut être différent des versions Linux et macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
