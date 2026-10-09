# Vocabulary data

`words-v2.json`: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ .
Frequency source: **wordfreq 3.1.1**, Copyright 2022 Robyn Speer and contributors,
https://github.com/rspeer/wordfreq . Its source attributions and licensing terms
are reproduced in `wordfreq-NOTICE.md`.

Morphological source: **OpenCorpora**, https://opencorpora.org/ , CC BY-SA 3.0,
https://creativecommons.org/licenses/by-sa/3.0/ , distributed with
pymorphy3-dicts-ru 2.4.417150.4580142. Morphological tooling: pymorphy3 2.0.6 (MIT).

Changes: frequent Russian forms reduced to dictionary lemmas; proper names,
abbreviations and tagged archaic/incorrect forms filtered; original N-back
vocabulary preserved; additional contemporary vocabulary added. This is an
automatically filtered dictionary, not a claim of individual editorial review
of every word. It includes common and less frequent vocabulary.

`phrases-v2-*.json`: original combinatorial bank created for this application,
CC BY-SA 4.0. One-word entries derive from the above vocabulary. Templates,
agreement rules and reproducible generation are in `tools/build_phrases.py`.
Word counts use whitespace-separated words; hyphenated words count as one.

Version 2: folded е/ё duplicates and six spelling variants removed;
61 human scene groups and 10 nonhuman event groups, with context-specific
constraints. 300,000 multiword combinations selected reproducibly.
