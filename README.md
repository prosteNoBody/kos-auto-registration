# kos_auto_registration
Automatically registrate lessons

Systém slouží k automatickému zapsání hodin (pro použití je potřeba mít nainstalovaný node.js)
- naklonujte git respozitář
- v terminálu spusťte příkaz "npm i" v projektové složce
- zkopírujte "userExample.json", vyplňtě vaše údaje od KOSu a poté soubor přejmenujte na "user.json"
- poté stačí použít příkaz "node app.js"

program pak každé 3min kontroluje jestli se neuvolnila prioritní nebo sekundární hodina
- pokud se najde prioritní hodina tak to program oznámí a ukončí se
- pokud se najde sekundární hodina tak to program oznámí ale dále bude zkoušet zapsat prioritní
- pokud program z neznámých důvodů spadne tak vypíše error hlášku a po 20min se zase restartuje

program je navržený pro dlouhodobý běh a pokud se mezitím restartuje bude znova hledat sekundární i prioritní hodiny
- prioritní a sekundární hodiny jsi lze pomocí selektorů vybrat