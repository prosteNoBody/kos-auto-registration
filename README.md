## BUGFIXES!!
prosím aktivně kontrolovat jestli nevyšla nová verze aplikace (aktivně zkoušet `git fetch; git pull` a pak restartovat samotnou apliakci - pokud běží). Může se stát že v programu bude chyba, kterou se samozřejmě snažím hned opravit, ale verzi si musíte updatovat samy.

### Popis
Aplikace funguje na bázi knihovny puppeteer, což je headless chromium. Takže zápis je simulace toho, co by jste normálně museli zaklikat.<br>
Program se vyplatí využít např. pro automatický zápis při otvírání rozvrhu, nebo pokud čekáte na uvolnění místa. Výhoda je také to, že si můžete dát podle prioritně více možností určitě paralelky a program se bude snažit zapsat tu nejlepší.
### Konfigurace
Je potřeba mít nainstalovaný nodejs (otestováno pro verzi 16.16.0), npm a příkaz make. (jde to i bez něj, stačí si nainstalovat npm balíčky a pak ručně zpustit `node app`)<br>
Ve složce konfig je potřeba mít soubor `user.json` ve kterém jsou vaše přihlašovací údaje a soubor `lessons.json` ve kterém jsou nastavené hodiny, které chcete zapsat.<br>
Příklad `user.json`:<br>
```json
{
  "username": "",
  "password": ""
}
```
Příklad `lessons.json`
```json
{
  "bi-osy.21": [
    "1P",
    "2P",
    "2C",
    "4C",
    "3L"
  ],
  "bi-ma1.21": [
    "25C",
    "29C"
  ]
}
```
Např. nahoře u příkladu by se snažil zapsat přednášku 1P, ale pokud by nebyla volná tak zapíše 2P, ale dál bude zkoušet 1P.
### Spuštění
Pro prvotní zapnutí stačí `make`, při dalším použití nebo restartu stačí `make run`, které vynechá `npm i`. Před zapnutím je potřeba správně nakonfigurovat. Program pak vyhazuje logy do informační logy do terminálu.
### Proces zápisu
Bot se přihlasí a nejdřív vyzkouší jestli je zápis otevřen, pokud je tak postupně kouká na hodiny, které jsou dostupné a na hodiny, které jsou v `lessons.json`. Všechny hodiny se rozpoznávají podle parallelID (např. "1P", "25C").<br>
Paralelka má vždy nějaké ID což je číslo a pak identifikátor typu hodiny:
- P - přednáška
- C - cvičení
- L - laborka

Všechny ID hodin se dají najít na sylabusu předmětu ještě před otevřením rozvrhu, popř. pokud jen čekáte na lepší hodinu kde už není místo tak přímo v tvorbě rozvrhu je vpravo nahoře u karty paralelky tento identifikátor.
### Logika rozhodování při zápisu
Nejdříve si program rozdělí zapsané hodiny na přednášky, cvičení a laborky. Potom z každé skupiny jde v pořadí od prvního k poslednímu a řídí se tímto postupem:
1. Pokud hodina v pořadí nebyla nalezena v rozvrhu tak se přeskočí a pokračuje další v pořadí
2. Pokud hodina v pořadí už je zapsaná tak se zápis daného druhu hodiny (přednáška, cvičení, laborky) ukončuje, protože je zvolená ta lepší v pořadí
3. Pokud hodina v pořadí není zapsaná tak se zkusí zapsat, pokud to jde tak se zapíše a zápis daného druhu hodiny končí, pokud to nejde a je plně obsazená tak jde na další v pořadí

Celý tento proces se pak dělá s každým druhem hodiny v každém kurzu a to se opakuje každé 3min. Jsou zde i fallbacky, pokud by náhodou v programu nastala chyba (programátorská chyba, nebo spadne KOS) tak se program po 20min znova zresetuje a zkouší dál.