# Σχετικά με την Τεκμηρίωση

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Ο σκοπός αυτής της τεκμηρίωσης είναι να εξηγήσει αναλυτικά το Node.js API, τόσο από την πλευρά της αναφοράς όσο και σαν ιδέα. Κάθε τμήμα περιγράφει μια ενσωματωμένη ενότητα ή μια ιδέα υψηλού επιπέδου.

Κατά περίπτωση, οι τύποι ιδιοτήτων, οι παράμετροι μεθόδων καθώς και οι παράμετροι που παρέχονται στους χειριστές συμβάντων, αναλύονται λεπτομερώς σε μια λίστα κάτω από την κεφαλίδα του θέματος.

## Συνεισφορά

Αν βρείτε σφάλματα σε αυτήν την τεκμηρίωση, παρακαλούμε [καταχωρήστε ένα ζήτημα](https://github.com/nodejs/node/issues/new) ή δείτε [τον οδηγό συνεισφοράς](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) για να μάθετε πως να υποβάλετε ένα patch.

Κάθε αρχείο δημιουργείται βασισμένο στο αντίστοιχο αρχείο `.md` που βρίσκεται στον φάκελο `doc/api/` μέσα στον πηγαίο κώδικα της Node.js. Αυτή η τεκμηρίωση δημιουργείται με τη χρήση του εργαλείου `tools/doc/generate.js`. Ένα πρότυπο HTML βρίσκεται στο `doc/template.html`.

## Δείκτης Σταθερότητας

<!--type=misc-->

Καθόλη τη διάρκεια της τεκμηρίωσης υπάρχουν ενδείξεις της σταθερότητας μιας ενότητας. Το API της Node.js αλλάζει σχετικά, και καθώς ωριμάζει, κάποια μέρη του είναι πιο αξιόπιστα απ'ότι άλλα. Κάποια είναι τόσο σταθερά, και τόσο χρησιμοποιούμενα, που είναι πρακτικά εντελώς απίθανο να αλλάξουν. Κάποια άλλα μέρη είναι ολοκαίνουρια και πειραματικά, ή είναι γνωστό ότι είναι επικίνδυνα και βρίσκονται σε φάση επανασχεδιασμού.

Οι δείκτες σταθερότητας είναι οι παρακάτω:

```txt
Stability: 0 - Deprecated
This feature is known to be problematic, and changes may be planned. Do
not rely on it. Use of the feature may cause warnings to be emitted.
Δεν πρέπει να αναμένεται συμβατότητα με προηγούμενες εκδόσεις, μεταξύ μειζόνων εκδόσεων.
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

*Note*: Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. Οι τελικοί χρήστες μπορεί να μην γνωρίζουν ότι χρησιμοποιούνται πειραματικά χαρακτηριστικά, και μπορεί να συναντήσουν απρόσμενα σφάλματα ή αλλαγές συμπεριφοράς όταν γίνουν αλλαγές στο API. Για την αποφυγή τέτοιων εκπλήξεων, τα `Πειραματικά` χαρακτηριστικά μπορεί να χρειάζονται μια επιλογή γραμμή εντολών για την ρητή ενεργοποίησή τους, αλλιώς μπορεί να προκαλέσουν μετάδοση προειδοποιήσεων. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`process.on('warning')`][] event.

## Έξοδος JSON
<!-- YAML
added: v0.6.12
-->

> Σταθερότητα: 1 - Πειραματικό

Κάθε έγγραφο `.html` έχει ένα αντίστοιχο έγγραφο `.json` που παρουσιάζει τις ίδιες πληροφορίες, σε μια πιο δομημένη μορφή. Αυτό το χαρακτηριστικό είναι πειραματικό, και έχει προστεθεί προς όφελος των IDE και άλλων βοηθητικών προγραμμάτων που επιθυμούν να κάνουν κάποια πράγματα με την τεκμηρίωση, σε πιο προγραμματιστικό στυλ.

## Κλήσεις συστήματος και σελίδες man

Ο κλήσεις συστήματος, όπως η open(2) και η read(2), ορίζουν την διεπαφή μεταξύ των προγραμμάτων του χρήστη και του υποκείμενου λειτουργικού συστήματος. Node functions which simply wrap a syscall, like [`fs.open()`][], will document that. Η τεκμηρίωση περιέχει συνδέσμους στις αντίστοιχες σελίδες man (συντομογραφία του manual - εγχειρίδιο) οι οποίες περιγράφουν τον τρόπο λειτουργίας των αντίστοιχων κλήσεων συστήματος.

Κάποιες κλήσεις συστήματος, όπως το lchown(2), είναι ειδικές σε συστήματα BSD. That means, for example, that [`fs.lchown()`][] only works on macOS and other BSD-derived systems, and is not available on Linux.

Οι περισσότερες κλήσεις συστήματος Unix έχουν αντίστοιχες στα Windows, αλλά οι συμπεριφορές τους μπορεί να διαφέρουν στα Windows, σε σχέση με το Linux και το macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
