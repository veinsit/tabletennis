"use strict";

import ut = require("../utils");
import emo = require("../assets/emoji");
import menu = require("./menu");

var getPidData
export const initModule = (bot, _getPidData) => {
    getPidData = _getPidData
    bot.hear(['pingpong', 'ping pong', 'tt', 'tennistavolo', 'tennis tavolo'],
    
        (payload, chat) => {
          const pid = getPidData(payload.recipient.id)
          bot.accessToken = pid.atok
    
          showHelpPingPong(chat)
        });     
 }

export const onMessage = (chat, text, page_id): boolean => {
    // The \b denotes a word boundary,
    let regex1 = /\b(?:fitet|ping\s?pong|table\s?tennis|tt|tennis\s+tavolo)\b\s+\b(?:squadra|team)\b\s+(\d+)/i
    let match1 = regex1.exec(text)
    if (match1 && match1.length >= 2 && match1[1]) {
        onMessageSquadra(chat, match1[1])
        return true;
    }
    regex1 = /\b(?:fitet|ping\s?pong|table\s?tennis|tt|tennis\s+tavolo)\b\s+\b(?:calendario|date|incontri)\b/i
    match1 = regex1.exec(text)
    if (match1 && match1.length >= 1) {
        onMessageCalendario(chat)
        return true;
    }
    /*
    if (!text.startsWith("tt "))
        return false;

    const data: string = (text as string).substring(3);

    let match = /squadra\s+(\d+)/i.exec(data)
    if  (match && match.length >= 2 && match[1]) {
        onMessageSquadra(chat, match[1])
        return true;
    }
    */

    return false;
}

export const onPostback = (pl: string, chat, data, page_id): boolean => {

    if (pl.startsWith("...")) {
        return true;
    }
    return false;
}

function getSquadra(squadra, callback) {
    return ut.httpGet('portale.fitet.org', `/risultati/campionati/percentuali.php?SQUADRA=${squadra}&CAM=916`, callback);
}

const squadre = [{ cod: 7401, name: "Castrocaro PUB" }]
function onMessageSquadra(chat, codSquadra) {

    getSquadra(codSquadra, (html: string) => {

        const codAtletaPrefix='dettaglio_percentuali.php?IDA='
        const nomeAtletaPrefix = `SQUADRA=${codSquadra}'>`
        const dataPrefix = "<p class=dettagli>"

        const atleti = []
        loopWhile(html)

        displayAtleti(chat, atleti)
        .then(() => menu.showHelp(chat))

        function loopWhile(h: string) {
//            const indexPrefix = h.indexOf(nomeAtletaPrefix)
            const indexPrefix = h.indexOf(codAtletaPrefix)
            if (indexPrefix >= 0) {
//                const indexAtleta = indexPrefix + nomeAtletaPrefix.length
                const indexAtleta = indexPrefix + codAtletaPrefix.length
                let hh = parseAtleta(h.substring(indexAtleta));
                loopWhile(hh);
            }
        }

        function parseAtleta(h: string): string {
            const codAtleta = h.substring(0, h.indexOf("&"))
            
            // <a href='dettaglio_percentuali.php?IDA=729176&CAM=916&SQUADRA=7401'>CANGINI MATTEO</a>
            h = h.substring(h.indexOf(nomeAtletaPrefix) + nomeAtletaPrefix.length)
            const nomeAtleta = h.substring(0, h.indexOf("</a>"))

            h = h.substring(h.indexOf(dataPrefix) + dataPrefix.length)
            const ranking = h.substring(0, h.indexOf("</p>"))

            h = h.substring(h.indexOf(dataPrefix) + dataPrefix.length)
            const partiteDisputate = h.substring(0, h.indexOf("</p>"))

            h = h.substring(h.indexOf(dataPrefix) + dataPrefix.length)
            const partiteVinte = h.substring(0, h.indexOf("</p>"))

            atleti.push({ nomeAtleta, codAtleta, codSquadra, ranking, partiteDisputate, partiteVinte })
            return h;

        }
    })
    //    const codSquadra = squadre[0].cod



    // portale.fitet.org/risultati/campionati/percentuali.php?SQUADRA=7401&CAM=916
    /*
        ></a>
        </td><td height=24><p class=dettagli><a href='dettaglio_percentuali.php?IDA=729176&CAM=916&
        SQUADRA=7401'>CANGINI MATTEO</a></p></td><td height=24><p 
        class=dettagli>rank. 5866 (2796)</p></td><td height=24><center>
        <p class=dettagli>3</p></center></td><td height=24><center>
        <p class=dettagli>2</p></center></td><td height=24><center>
        <p class=dettagli>1</p></center></td><td height=24><center>
        <p class=dettagli>7</p></center></td><td height=24><center>
        <p class=dettagli>6</p></center></td><td height=24><center>
        <p class=dettagli>134</p></center></td><td height=24><center>
        <p class=dettagli>126</p></center></td><td height=24><b><center>
        <p class=dettagli>66.7</p></center></b></td></tr><tr><td><a href='../new_rank/DettaglioAtleta.php?ATLETA=717524&ZU=0&AVVERSARIO=0&ID_CLASS=150'><img src='../../images/images.jpg' width=14 height=15 border=0
    */
}

function displayAtleti(chat, atleti: any[]) {
    /*
    ut.loop(0, atleti.length, (i) =>
        chat.say(`${atleti[i].nomeAtleta} ${atleti[i].ranking}, vinte ${atleti[i].partiteVinte} su ${atleti[i].partiteDisputate}`)
    )
    */
    return chat.say("Ecco gli atleti della squadra:").then(() => 
        chat.sendGenericTemplate(
            atleti.map((currElement, index) =>
                atletaTemplateElement(currElement)
            ), //elements, 
            { image_aspect_ratio: 'horizontal ' }
        ) // horizontal o square))
    )

    // ok sia per List che per generic
    function atletaTemplateElement(a): any {
        return {
            title: a.nomeAtleta+" ("+a.codAtleta+")",
            subtitle: `${a.ranking}, vinte ${a.partiteVinte} su ${a.partiteDisputate}`,
            // image_url: ut.gStatMapUrl(`size=${mapAttachmentSizeRect}${mp}${mf}`),
            buttons: [
                ut.weburlBtn("Incontri", `http://portale.fitet.org/risultati/campionati/dettaglio_percentuali.php?IDA=${a.codAtleta}&CAM=916&SQUADRA=${a.codSquadra}` ),
                //ut.weburlBtn("Orari Domani", sv.getStopScheduleUri(bacino, ss.stop.stop_id, 1)),
            ]
        }
    }
}


function getCalendario(callback) {
    return ut.httpGet('portale.fitet.org', `/risultati/regioni/default_reg.asp?REG=9`, callback);
}

function onMessageCalendario(chat) {

    chat.say('Vedi http://portale.fitet.org' + `/risultati/regioni/default_reg.asp?REG=9`)
    // getCalendario((html:string) => {  })
    //    const codSquadra = squadre[0].cod

}


export function onLocationReceived(chat, coords, page_id) {
}



 const showHelpPingPong = (chat) =>
 chat.say(
   `In ogni momento, puoi scrivere "ping pong" oppure "tt", seguito da:
- la parola "squadra" seguita dal codice della squadra Ad esempio: "tt squadra 7401".`
, { typing: true }
 ).then(() => require("./menu").showHelp(chat))

 /*
 <form method="POST" 
 action="ricerca_atleti.php?ID_CLASSIFICA=151" class="stile_menu" style="text-align: center; margin: 0; vertical-align:medium">
<p class="stile_2" style="text-align: center; margin-top:0; margin-bottom:0"><base target="classifica">
<a href="../../fpdf2/stampa_generale_comitato.php?CLASSIFICA=151&COMIT=9&SESSO=M">Stampa Generale</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;Ricerca atleta<font color="#000000">&nbsp;
<input type="text" name="cerca" size="19" style="width: 165px"><input type="hidden" value="9" name="COMITATO"><input type="hidden" value="32" name="ANNATA">&nbsp;<input type="submit" value="Cerca" name="B1"></font>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<a href="../../fpdf2/stampa_generale_comitato.php?CLASSIFICA=151&COMIT=9&SESSO=F">Stampa Generale</a>
</p></form>

                   */