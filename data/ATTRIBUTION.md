# Vocabulary data

`words-v2.json` combines the original bank with an editorial expansion dated
14 October 2026. Source-specific terms are listed below; the expanded file is
not presented as a newly relicensed copy of every source under one license.
Frequency source: **wordfreq 3.1.1**, Copyright 2022 Robyn Speer and contributors,
https://github.com/rspeer/wordfreq . Its source attributions and licensing terms
are reproduced in `wordfreq-NOTICE.md`.

Morphological source: **OpenCorpora**, https://opencorpora.org/ , CC BY-SA 3.0,
https://creativecommons.org/licenses/by-sa/3.0/ , distributed with
pymorphy3-dicts-ru 2.4.417150.4580142. Morphological tooling: pymorphy3 2.0.6 (MIT).

The original frequency-derived bank uses CC BY-SA 4.0,
https://creativecommons.org/licenses/by-sa/4.0/ .

Additional sources used for candidate discovery and grammatical or spelling
verification:

- A. A. Zalizniak, *Grammatical Dictionary*, sixth-edition data (2010),
  https://github.com/gramdict/zalizniak-2010 , snapshot
  `c39322cb50aec024dd46aa182796520f77bf3dab`. Published with the permission of
  rights holder Anna Andreevna Zalizniak; CC BY-NC 4.0,
  https://creativecommons.org/licenses/by-nc/4.0/ .
- OpenRussian, https://github.com/Badestrand/russian-dictionary , TSV snapshot
  `50e210c4803237779cb562bc1abcea529066031c`; CC BY-SA 4.0.
- Harrix Russian-Nouns, Sergienko Anton,
  https://github.com/Harrix/Russian-Nouns , snapshot
  `6f0ae9f0619cf0401c6935b7cbba1165bf4c7f19`; MIT, see
  `harrix-NOTICE.md`.
- V. V. Lopatin and O. E. Ivanova (editors), *Russian Orthographic
  Dictionary* (2025), and the Institute of Russian Language RAS electronic
  resource «Академос», https://orfo.ruslang.ru/ , including its 2025–2026
  additions; consulted for spelling and headword verification.
- O. N. Lyashevskaya and S. A. Sharov, frequency dictionary based on the
  Russian National Corpus, http://dict.ruslang.ru/freq.php ; consulted for
  frequency and part-of-speech comparison.

Changes: candidates were selected for modern, understandable usage; initial
forms and parts of speech were corrected; duplicate spellings were merged
using Unicode normalization, case folding and е/ё equivalence. The rejected
pool from the two fast passes was reviewed again. Definitions and dictionary
articles are not included in the game file. Existing baseline entries were
retained apart from confirmed category moves and one numeral normalization.

Multiword phrase chunks now contain sentences from Tatoeba under CC BY 2.0 FR.
See phrase-ATTRIBUTION.md and phrase-sources.tsv for contributor names and sentence IDs.
One-word entries retain the vocabulary license above.
Hyphenated words count as one whitespace-delimited word.
