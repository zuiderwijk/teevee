# Raw Dutch EPG channel inventory — 2026-09-24

Status: **EMPIRICAL LIVE-SOURCE INVENTORY**  
Source: `https://iptv-epg.org/files/epg-nl.xml`  
Observed: 2026-09-23T22:27:11.958Z (00:27 Europe/Amsterdam on 24 September 2026)  
Research PR: #162

## Purpose

This document records the complete channel inventory exposed by the current **raw development XMLTV feed**. It is source evidence only: presence in the feed does **not** mean a channel is approved for Teevee, correctly named, licensed for production redistribution, or suitable for the default channel lineup.

Teevee currently maps only the narrow canonical development catalog in `server/epg/developmentChannelCatalog.ts`. Provider IDs below must never be promoted to canonical Teevee IDs by assumption.

## Snapshot

- XML bytes: **36,606,703**
- channel records: **184**
- unique provider channel IDs: **184**
- programme rows: **40,282**
- channel records with at least one programme row: **184**
- channel records without programme rows: **0**
- programme rows referencing unknown channel IDs: **0**

The feed currently contains **184** channel records, correcting older conversational references to 154. `docs/DATA.md` already reflected the 184-channel count before this inventory.

Programme-row count is included only as a source-quality/coverage clue. It is **not** audience size, importance or evidence that every record represents a normal linear TV service. Several source records have identical-looking bounded coverage counts and names such as package information, streaming brands, test/overview services or other pseudo-channel surfaces; those need separate inspection before product inclusion.

## Product-relevant observations

- The full sports families are present: **ESPN, ESPN 2, ESPN 3, ESPN 4, ESPN UHD**, plus a separate `ESPN Premium` source record; and **Ziggo Sport, Ziggo Sport 2–6, Ziggo Sport Extra, Ziggo Sport UHD**, plus Ziggo Live Events.
- Belgian/VRT-labelled records present are **VRT 1**, **VRT CANVAS**, **Canvas**, **Ketnet** and **één**. No VTM or Play-family record appears in this snapshot. `VRT 1`/ `één` and `VRT CANVAS`/ `Canvas` are alias candidates by naming and matching high-level coverage shape; do not map both without programme-level equivalence verification.
- Relevant mainstream/thematic records that are not in Teevee's current 12-channel mapping include **24Kitchen, Animal Planet, BBC First, BBC One, BBC Two, Comedy Central, Discovery, Disney Channel, ESPN 1–4, Eurosport 1–2, History, ID Investigation Discovery, National Geographic Channel, National Geographic Wild, Nickelodeon, Nick Jr., Paramount Network, TLC, Viaplay TV, Viaplay TV+, Ziggo Sport 1–6** and many others.
- The source still labels one record **FOX** and does not expose a channel named `STAR Channel`. Any intended STAR Channel mapping therefore requires an explicit provider-identity/content verification rather than a name assumption.
- The raw source contains records that should not automatically become Teevee channels, including examples such as **Netflix, Prime Video, Videoland, Radio Informatie, Testbeeld, Erotiek Pakket info, Ziggo Zenderoverzicht** and generic `NPO` / `RTL` records.
- Channel icon presence is source metadata only. Existing Teevee logo provenance/licensing rules remain separate.

## Complete source inventory

| # | Display name | Provider channel ID | Programmes | Source icon |
| ---: | --- | --- | ---: | :---: |
| 1 | Cartoonito | `Cartoonito.nl` | 843 | no |
| 2 | Centraal+ TV | `Centraal+TV.nl` | 40 | no |
| 3 | Curiosity Channel | `CuriosityChannel.nl` | 279 | no |
| 4 | Den Haag TV | `DenHaagTV.nl` | 40 | no |
| 5 | ESPN Premium | `ESPNPremium.nl` | 40 | no |
| 6 | Feel Good TV | `FeelGoodTV.nl` | 40 | no |
| 7 | Haaglanden TV | `HaaglandenTV.nl` | 40 | no |
| 8 | Midvliet TV | `MidvlietTV.nl` | 40 | no |
| 9 | Moonbug | `Moonbug.nl` | 335 | no |
| 10 | njam! | `njam.nl` | 261 | no |
| 11 | Omroep Delft TV | `OmroepDelftTV.nl` | 40 | no |
| 12 | Omroep Gelderland | `OmroepGelderland.nl` | 200 | no |
| 13 | TOP40 TV | `TOP40TV.nl` | 57 | no |
| 14 | VRT 1 | `VRT1.nl` | 294 | no |
| 15 | VRT CANVAS | `VRTCANVAS.nl` | 108 | no |
| 16 | ZFM-TV Zoetermeer | `ZFM-TVZoetermeer.nl` | 40 | no |
| 17 | Ziggo Sport Extra | `ZiggoSportExtra.nl` | 41 | no |
| 18 | 100% NL TV | `100_NLTV.nl` | 48 | yes |
| 19 | 192 TV | `192TV.nl` | 108 | yes |
| 20 | 24Kitchen | `24Kitchen.nl` | 287 | yes |
| 21 | 2M | `2M.nl` | 249 | yes |
| 22 | Al Arabiya | `AlArabiya.nl` | 72 | yes |
| 23 | Aljazeera | `Aljazeera.nl` | 72 | yes |
| 24 | Aljazeera English | `AljazeeraEnglish.nl` | 257 | yes |
| 25 | Animal Planet | `AnimalPlanet.nl` | 196 | yes |
| 26 | ARD | `ARD.nl` | 245 | yes |
| 27 | Arte | `Arte.nl` | 197 | yes |
| 28 | AT5 | `AT5.nl` | 719 | yes |
| 29 | ATV Avrupa | `ATVAvrupa.nl` | 83 | yes |
| 30 | Baby TV | `BabyTV.nl` | 2219 | yes |
| 31 | BBC Entertainment | `BBCEntertainment.nl` | 72 | yes |
| 32 | BBC First | `BBCFirst.nl` | 160 | yes |
| 33 | BBC One | `BBCOne.nl` | 260 | yes |
| 34 | BBC Two | `BBCTwo.nl` | 167 | yes |
| 35 | BBC World News | `BBCWorldNews.nl` | 393 | yes |
| 36 | Boomerang | `Boomerang.nl` | 829 | yes |
| 37 | Canvas | `Canvas.nl` | 108 | yes |
| 38 | CBS Reality | `CBSReality.nl` | 72 | yes |
| 39 | CGTN | `CGTN.nl` | 72 | yes |
| 40 | CNBC Europe | `CNBCEurope.nl` | 289 | yes |
| 41 | CNN | `CNN.nl` | 216 | yes |
| 42 | Comedy Central | `ComedyCentral.nl` | 335 | yes |
| 43 | Comedy Central Extra | `ComedyCentralExtra.nl` | 72 | yes |
| 44 | Crime+Investigation | `Crime+Investigation.nl` | 218 | yes |
| 45 | DanceTelevision | `DanceTelevision.nl` | 143 | yes |
| 46 | Discovery | `Discovery.nl` | 181 | yes |
| 47 | Discovery Science | `DiscoveryScience.nl` | 280 | yes |
| 48 | Disney Channel | `DisneyChannel.nl` | 437 | yes |
| 49 | Dreamworks | `Dreamworks.nl` | 411 | yes |
| 50 | DUSK | `DUSK.nl` | 72 | yes |
| 51 | E! Entertainment | `E_Entertainment.nl` | 182 | yes |
| 52 | Erotiek Pakket info | `ErotiekPakketinfo.nl` | 72 | yes |
| 53 | ESPN | `ESPN.nl` | 278 | yes |
| 54 | ESPN 2 | `ESPN2.nl` | 271 | yes |
| 55 | ESPN 3 | `ESPN3.nl` | 229 | yes |
| 56 | ESPN 4 | `ESPN4.nl` | 184 | yes |
| 57 | ESPN UHD | `ESPNUHD.nl` | 278 | yes |
| 58 | Euro D | `EuroD.nl` | 75 | yes |
| 59 | Euronews | `Euronews.nl` | 597 | yes |
| 60 | Eurosport 1 | `Eurosport1.nl` | 108 | yes |
| 61 | Eurosport 2 | `Eurosport2.nl` | 122 | yes |
| 62 | Eurostar | `Eurostar.nl` | 51 | yes |
| 63 | Evil Angel | `EvilAngel.nl` | 72 | yes |
| 64 | Family7 | `Family7.nl` | 326 | yes |
| 65 | Fashion TV | `FashionTV.nl` | 334 | yes |
| 66 | Film1 Action | `Film1Action.nl` | 112 | yes |
| 67 | Film1 Drama | `Film1Drama.nl` | 93 | yes |
| 68 | Film1 Family | `Film1Family.nl` | 109 | yes |
| 69 | Film1 On Demand | `Film1OnDemand.nl` | 72 | yes |
| 70 | Film1 Premiere | `Film1Premiere.nl` | 97 | yes |
| 71 | FilmBox | `FilmBox.nl` | 91 | yes |
| 72 | FOX | `FOX.nl` | 211 | yes |
| 73 | Habertürk | `Haberturk.nl` | 112 | yes |
| 74 | History | `History.nl` | 230 | yes |
| 75 | Horse & Country TV | `HorseAndCountryTV.nl` | 108 | yes |
| 76 | ID Investigation Discovery | `IDInvestigationDiscovery.nl` | 179 | yes |
| 77 | Ketnet | `Ketnet.nl` | 719 | yes |
| 78 | L1 TV | `L1TV.nl` | 211 | yes |
| 79 | Love Nature | `LoveNature.nl` | 174 | yes |
| 80 | Love Nature 4K | `LoveNature4K.nl` | 72 | yes |
| 81 | MBC | `MBC.nl` | 72 | yes |
| 82 | Mediaset Italia | `MediasetItalia.nl` | 176 | yes |
| 83 | Mezzo | `Mezzo.nl` | 135 | yes |
| 84 | MTV | `MTV.nl` | 242 | yes |
| 85 | MTV 80s | `MTV80s.nl` | 72 | yes |
| 86 | MTV 90s | `MTV90s.nl` | 72 | yes |
| 87 | MTV Hits | `MTVHits.nl` | 72 | yes |
| 88 | MTV Live | `MTVLive.nl` | 72 | yes |
| 89 | MvH Hard | `MvHHard.nl` | 399 | no |
| 90 | MyZen | `MyZen.nl` | 216 | yes |
| 91 | National Geographic Channel | `NationalGeographicChannel.nl` | 198 | yes |
| 92 | National Geographic Wild | `NationalGeographicWild.nl` | 226 | yes |
| 93 | NDR | `NDR.nl` | 271 | yes |
| 94 | Net5 | `Net5.nl` | 163 | yes |
| 95 | Netflix | `Netflix.nl` | 72 | yes |
| 96 | NH Nieuws | `NHNieuws.nl` | 353 | yes |
| 97 | Nick Jr. | `NickJr.nl` | 564 | yes |
| 98 | Nick Music | `NickMusic.nl` | 72 | yes |
| 99 | Nickelodeon | `Nickelodeon.nl` | 456 | yes |
| 100 | Nicktoons | `Nicktoons.nl` | 495 | yes |
| 101 | NPO | `NPO.nl` | 72 | yes |
| 102 | NPO 1 | `NPO1.nl` | 352 | yes |
| 103 | NPO 1 Extra | `NPO1Extra.nl` | 216 | yes |
| 104 | NPO 2 | `NPO2.nl` | 263 | yes |
| 105 | NPO 2 Extra | `NPO2Extra.nl` | 214 | yes |
| 106 | NPO 3 | `NPO3.nl` | 615 | yes |
| 107 | NPO Politiek en Nieuws | `NPOPolitiekenNieuws.nl` | 55 | yes |
| 108 | Omroep Brabant | `OmroepBrabant.nl` | 395 | yes |
| 109 | Omroep Flevoland | `OmroepFlevoland.nl` | 663 | yes |
| 110 | Omroep Zeeland | `OmroepZeeland.nl` | 383 | yes |
| 111 | Omrop Fryslân | `OmropFryslan.nl` | 282 | yes |
| 112 | ONS | `ONS.nl` | 210 | yes |
| 113 | OUTTV | `OUTTV.nl` | 173 | yes |
| 114 | Paramount Network | `ParamountNetwork.nl` | 178 | yes |
| 115 | PassieXXX | `PassieXXX.nl` | 236 | yes |
| 116 | Pebble TV | `PebbleTV.nl` | 72 | yes |
| 117 | Penthouse Gold | `PenthouseGold.nl` | 260 | yes |
| 118 | Prime Video | `PrimeVideo.nl` | 72 | yes |
| 119 | Radio Informatie | `RadioInformatie.nl` | 72 | no |
| 120 | RTL | `RTL.nl` | 159 | yes |
| 121 | RTL 4 | `RTL4.nl` | 342 | yes |
| 122 | RTL 5 | `RTL5.nl` | 118 | yes |
| 123 | RTL 7 | `RTL7.nl` | 166 | yes |
| 124 | RTL 8 | `RTL8.nl` | 91 | yes |
| 125 | RTL Crime | `RTLCrime.nl` | 179 | yes |
| 126 | RTL Lounge | `RTLLounge.nl` | 248 | yes |
| 127 | RTL Telekids | `RTLTelekids.nl` | 678 | yes |
| 128 | RTL Z | `RTLZ.nl` | 411 | yes |
| 129 | RTV Utrecht | `RTVUtrecht.nl` | 733 | yes |
| 130 | RTV-7 | `RTV-7.nl` | 116 | yes |
| 131 | Sat. 1 | `Sat1.nl` | 152 | yes |
| 132 | SBS6 | `SBS6.nl` | 259 | yes |
| 133 | SBS9 | `SBS9.nl` | 97 | yes |
| 134 | Secret Circle | `SecretCircle.nl` | 494 | yes |
| 135 | SET Asia | `SETAsia.nl` | 160 | yes |
| 136 | Shorts TV | `ShortsTV.nl` | 166 | yes |
| 137 | ShowTürk | `ShowTurk.nl` | 65 | yes |
| 138 | SLAM | `SLAM.nl` | 49 | yes |
| 139 | Stingray Classica | `StingrayClassica.nl` | 179 | yes |
| 140 | Stingray DJAZZ | `StingrayDJAZZ.nl` | 205 | yes |
| 141 | Stingray LiteTV | `StingrayLiteTV.nl` | 37 | yes |
| 142 | Testbeeld | `Testbeeld.nl` | 72 | no |
| 143 | TLC | `TLC.nl` | 188 | yes |
| 144 | Tommy TV | `TommyTV.nl` | 72 | yes |
| 145 | TRT Müzik | `TRTMuzik.nl` | 80 | yes |
| 146 | TRT Türk | `TRTTurk.nl` | 291 | yes |
| 147 | TRT Çocuk | `TRTCocuk.nl` | 221 | yes |
| 148 | TV Drenthe | `TVDrenthe.nl` | 479 | yes |
| 149 | TV Gelderland | `TVGelderland.nl` | 200 | yes |
| 150 | TV Noord | `TVNoord.nl` | 521 | yes |
| 151 | TV Oost | `TVOost.nl` | 272 | yes |
| 152 | TV Oranje | `TVOranje.nl` | 87 | yes |
| 153 | TV Rijnmond | `TVRijnmond.nl` | 237 | yes |
| 154 | TV West | `TVWest.nl` | 442 | yes |
| 155 | TV5 Monde | `TV5Monde.nl` | 377 | yes |
| 156 | TV538 | `TV538.nl` | 69 | yes |
| 157 | TV8 Int | `TV8Int.nl` | 73 | yes |
| 158 | TVE | `TVE.nl` | 159 | yes |
| 159 | TVM Europe | `TVMEurope.nl` | 72 | yes |
| 160 | Ukraine 24 | `Ukraine24.nl` | 72 | yes |
| 161 | Utsav Gold | `UtsavGold.nl` | 54 | yes |
| 162 | Utsav Plus | `UtsavPlus.nl` | 317 | yes |
| 163 | Veronica / Disney XD | `VeronicaDisneyXD.nl` | 494 | yes |
| 164 | Viaplay TV | `ViaplayTV.nl` | 152 | yes |
| 165 | Viaplay TV+ | `ViaplayTVPlus.nl` | 103 | yes |
| 166 | Videoland | `Videoland.nl` | 72 | yes |
| 167 | WDR | `WDR.nl` | 252 | yes |
| 168 | X-MO | `X-MO.nl` | 182 | yes |
| 169 | XITE | `XITE.nl` | 65 | yes |
| 170 | ZDF | `ZDF.nl` | 228 | yes |
| 171 | Zee Cinema | `ZeeCinema.nl` | 54 | yes |
| 172 | Zee TV | `ZeeTV.nl` | 266 | yes |
| 173 | Ziggo Live Events | `ZiggoLiveEvents.nl.nl` | 72 | yes |
| 174 | Ziggo Sport | `ZiggoSport.nl` | 139 | yes |
| 175 | Ziggo Sport 2 | `ZiggoSport2.nl` | 167 | yes |
| 176 | Ziggo Sport 3 | `ZiggoSport3.nl` | 170 | yes |
| 177 | Ziggo Sport 4 | `ZiggoSport4.nl` | 100 | yes |
| 178 | Ziggo Sport 5 | `ZiggoSport5.nl` | 289 | yes |
| 179 | Ziggo Sport 6 | `ZiggoSport6.nl` | 88 | yes |
| 180 | Ziggo Sport UHD | `ZiggoSportUHD.nl` | 72 | yes |
| 181 | Ziggo TV | `ZiggoTV.nl.nl` | 85 | yes |
| 182 | Ziggo Zenderoverzicht | `ZiggoZenderoverzicht.nl` | 72 | yes |
| 183 | Zing | `Zing.nl` | 180 | yes |
| 184 | één | `een.nl` | 294 | yes |

## Interpretation boundary

This inventory answers **what is present in the raw feed**, not which channels Teevee should ship.

Before a new source record becomes a canonical Teevee channel, verify at minimum:
1. source record identity and current consumer-facing channel name;
2. whether apparent aliases/duplicates carry the same schedule or represent distinct services;
3. schedule freshness and required D-2..D+7 coverage;
4. explicit canonical Teevee channel ID and provider mapping;
5. production redistribution rights and logo provenance;
6. placement in the owner-approved provisional default channel order.

Do not infer mappings solely from similar names, historical branding or provider numbering.
