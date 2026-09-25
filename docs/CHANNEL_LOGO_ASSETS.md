# Teevee channel-logo asset provenance

Status: **ACTIVE LOCAL RASTER ASSET REGISTRY — PR #176 QA-FIX CANDIDATE**
Updated: **2026-09-25**

Teevee renders canonical channel marks from local PNG assets only. Runtime does not hotlink, download, recolour or tint channel marks. Light is the canonical base asset for all 49 IDs; dark appearance may resolve a broadcaster-specific verified negative/light-on-dark variant from the same central manifest. The central resolution path is:

`canonical channel ID -> channelLogoAssetManifest.ts -> channelLogoRegistry.ts -> ChannelIdentity`

The product owner has approved use of the channel marks for Teevee. This record preserves technical provenance and attribution evidence; broadcaster/trademark ownership remains with the respective brand owner. A mirror or Commons page is evidence/transport, not the legal basis for the product decision.

Runtime registry: `features/guide/channelLogoRegistry.ts`  
Canonical manifest: `features/guide/channelLogoAssetManifest.ts`  
Local assets: `assets/channels/`  
Byte integrity: `assets/channels/SHA256SUMS`

## Final 49-channel local asset set

| Canonical ID | Display name | Local asset | SHA-256 | Brand/author | Provenance page | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `nl-npo-1` | NPO 1 | `assets/channels/nl-npo-1.png` | `c7c6e373f0333e2495cee305fe58d9556676c6a2c5aba5ea0b9ccffa0e0cd7c3` | NPO | https://commons.wikimedia.org/wiki/File:NPO_1_logo_2014.svg | PD/simple-logo; trademark may apply |
| `nl-npo-2` | NPO 2 | `assets/channels/nl-npo-2.png` | `7c95d9fb023f6251f10c4a9d6766aced5b8225a35d01c47eb0d0990914c670f4` | NPO | https://commons.wikimedia.org/wiki/File:NPO_2_logo_2014.svg | PD/simple-logo; trademark may apply |
| `nl-npo-3` | NPO 3 | `assets/channels/nl-npo-3.png` | `19eaeb790732abdc3315979e77e8fc1a79dcfa3949fe91ddfe4846bedb7c045f` | NPO | https://commons.wikimedia.org/wiki/File:NPO_3_logo_2018.svg | PD/simple-logo; trademark may apply |
| `nl-rtl-4` | RTL 4 | `assets/channels/nl-rtl-4.png` | `b7aae5a2d1d481506dc32883e19f75d158491301322f70bf9ab85dcd9ef54584` | RTL Nederland | https://commons.wikimedia.org/wiki/File:RTL4_2023.svg | PD/simple-logo; trademark may apply |
| `nl-rtl-5` | RTL 5 | `assets/channels/nl-rtl-5.png` | `4071efc7e15f1848f5db6f4373c9590644f13a36f50d452dda160e879fb75403` | RTL Nederland | https://commons.wikimedia.org/wiki/File:RTL5_2023.svg | PD/simple-logo; trademark may apply |
| `nl-sbs-6` | SBS6 | `assets/channels/nl-sbs-6.png` | `e2ffc6081979e17d5bceb2263b3496e3fc514682d12ab627bece1078cf2ec609` | Talpa Network | https://commons.wikimedia.org/wiki/File:SBS6_Logo.png | CC BY-SA 4.0 / trademark |
| `nl-rtl-7` | RTL 7 | `assets/channels/nl-rtl-7.png` | `26273f2a1e4784d332186aff0e3addb2bde4ecdf376ba667e4bab2f71ae2c470` | RTL Nederland | https://commons.wikimedia.org/wiki/File:RTL7_2023.svg | PD-textlogo |
| `nl-veronica-disney-xd` | Veronica | `assets/channels/nl-veronica-disney-xd.png` | `495faadd7c3a91883b331a18db049f13fe510524b1f0c059286d4808005d2078` | Talpa Network / Kijk | https://commons.wikimedia.org/wiki/File:Veronica_TV_logo_2024.svg | PD-textlogo |
| `nl-net-5` | Net5 | `assets/channels/nl-net-5.png` | `d7a27be0ec693dbe23ac76a52eea19a17c57bd7aebd4d07ac3c4904fbc4e7b59` | Talpa Network | https://commons.wikimedia.org/wiki/File:Net5_Logo_2023.jpg | CC BY-SA 4.0 |
| `nl-rtl-8` | RTL 8 | `assets/channels/nl-rtl-8.png` | `c8406fe78c0afb35426979c7913215943c950c89df1a67175b16c590857c53c0` | RTL Nederland | https://commons.wikimedia.org/wiki/File:RTL8_2023.svg | PD-textlogo |
| `nl-star-channel` | STAR Channel | `assets/channels/nl-star-channel.png` | `bc513a8f7239c9b5dd5a1825a89a98ced0ebf0ca80a3d1cd66bb2152dc786516` | The Walt Disney Company | https://commons.wikimedia.org/wiki/File:Star_Channel_2023.svg | CC0 / trademark |
| `nl-sbs-9` | SBS9 | `assets/channels/nl-sbs-9.png` | `4a764a58a8b47e6be3210c4d03e6bca5c7ee2eff4539f11860bc7cfa912af943` | Talpa Network | https://commons.wikimedia.org/wiki/File:SBS_9_logo.png | PD-textlogo |
| `nl-paramount-network` | Paramount Network | `assets/channels/nl-paramount-network.png` | `0a1fd7f6138d5cbfca81fafe91bbf1f32937443aec709948320a6fb8ea8714ab` | Paramount Global | https://commons.wikimedia.org/wiki/File:Paramount_Network_(Black).svg | Commons file terms / trademark |
| `nl-ziggo-sport` | Ziggo Sport | `assets/channels/nl-ziggo-sport.png` | `1b3b89d34653545395817497b616f8490b5c93d5a6639ac8ff5ce6331546a063` | Ziggo B.V. | https://commons.wikimedia.org/wiki/File:Ziggo_Sport_logo_2026.svg | CC BY 4.0 |
| `nl-ziggo-sport-2` | Ziggo Sport 2 | `assets/channels/nl-ziggo-sport-2.png` | `8343969f7ca43e41bd43770b826525bbc7ad0eb5ea7ebef3be858e281a9d9d39` | Ziggo B.V. | https://commons.wikimedia.org/wiki/File:Ziggo_Sport_2.svg | Commons file terms / trademark |
| `nl-ziggo-sport-3` | Ziggo Sport 3 | `assets/channels/nl-ziggo-sport-3.png` | `18221733a7cfee8aaa3a8954952f99cd0eb00d541f1163c22f4b2881e9534e0f` | Ziggo B.V. | https://commons.wikimedia.org/wiki/File:Ziggo_Sport_3.svg | Commons file terms / trademark |
| `nl-ziggo-sport-4` | Ziggo Sport 4 | `assets/channels/nl-ziggo-sport-4.png` | `5c19f651d0111a7e967a4c90cc6ebc27ec932f78377333f3e7f4a8ba1fdb0767` | Ziggo B.V. | https://commons.wikimedia.org/wiki/File:Ziggo_Sport_4.svg | Commons file terms / trademark |
| `nl-ziggo-sport-5` | Ziggo Sport 5 | `assets/channels/nl-ziggo-sport-5.png` | `bcfe9dc7ee5d934e903aa211f6fb3af55b36ba66ec35863f6d48ab253394fef3` | Ziggo B.V. | https://commons.wikimedia.org/wiki/File:Ziggo_Sport_5.svg | Commons file terms / trademark |
| `nl-ziggo-sport-6` | Ziggo Sport 6 | `assets/channels/nl-ziggo-sport-6.png` | `cb2b3596ae6d43dd277f23e205ec3d087cb4b70e87163f89f8231bcf45102596` | Ziggo B.V. | https://commons.wikimedia.org/wiki/File:Ziggo_Sport_6.svg | Commons file terms / trademark |
| `nl-espn` | ESPN | `assets/channels/nl-espn.png` | `5c6f553e10163d501e9467afe89f8fc93ae6871333c752fdfcfe9ca5dc49d4f7` | ESPN | https://commons.wikimedia.org/wiki/File:ESPN_wordmark.svg | PD-textlogo |
| `nl-espn-2` | ESPN 2 | `assets/channels/nl-espn-2.png` | `87911b24a4e68fa6bbdd8ac4dc422b9ec1e7cf0be1f4f851ff8e21a3c8ba77c1` | ESPN | https://commons.wikimedia.org/wiki/File:ESPN2_logo.svg | PD-textlogo |
| `nl-espn-3` | ESPN 3 | `assets/channels/nl-espn-3.png` | `1a7b8160f83cac0789132c8ddb3be7a55c6e99ad8cac0f662f48ddc2da352ba3` | ESPN | https://commons.wikimedia.org/wiki/File:ESPN3_logo.svg | PD-textlogo |
| `nl-espn-4` | ESPN 4 | `assets/channels/nl-espn-4.png` | `f499e5382efa8779015dc097223b456506b69a0be3ffbe31df68ebc0071f903f` | ESPN | https://commons.wikimedia.org/wiki/File:ESPN_4_logo.svg | PD-textlogo |
| `nl-viaplay-tv` | Viaplay TV | `assets/channels/nl-viaplay-tv.png` | `53288ff19ab79f63c362c26cf4c9408f006d332402b00125c9ed26654371d12a` | Viaplay Group | https://commons.wikimedia.org/wiki/File:Viaplay_TV_logo.svg | PD-textlogo |
| `nl-rtl-z` | RTL Z | `assets/channels/nl-rtl-z.png` | `0b5ba6d39faaab34f30181894708646a267531e6e296f02e34d211cd4b25e8ef` | RTL Nederland | https://commons.wikimedia.org/wiki/File:RTLZ_2023.svg | PD-textlogo |
| `nl-tlc` | TLC | `assets/channels/nl-tlc.png` | `8f561f81e273874289bd3563b81b0800a8577457bf07d84da0f34038436ac07c` | Warner Bros. Discovery | https://commons.wikimedia.org/wiki/File:TLC_logo_(2023).svg | PD-textlogo |
| `nl-comedy-central` | Comedy Central | `assets/channels/nl-comedy-central.png` | `f7e90eab50897c1a7a11a6705c7e35f9ca8b7577ef66d77962c530191718de99` | Paramount Global | https://commons.wikimedia.org/wiki/File:Comedy_Central_2018.svg | PD-textlogo |
| `nl-24kitchen` | 24Kitchen | `assets/channels/nl-24kitchen.png` | `a29b2e4a796f02a800c07d0d9cfdd0c37fc91d565f30e35010b92c56280e0c77` | The Walt Disney Company | https://commons.wikimedia.org/wiki/File:24Kitchen.svg | PD-textlogo |
| `nl-eurosport-1` | Eurosport 1 | `assets/channels/nl-eurosport-1.png` | `07c92e1a35f3774de2b1075c50caa514205a8087f6dba99933a1c3df219b09f3` | Warner Bros. Discovery | https://commons.wikimedia.org/wiki/File:Eurosport_1_Logo_2015.svg | PD-textlogo |
| `nl-eurosport-2` | Eurosport 2 | `assets/channels/nl-eurosport-2.png` | `9415c69ac2b0339a27561651fcfffc61b6346722e624b5881dcc7e251dfc2c44` | Warner Bros. Discovery | https://commons.wikimedia.org/wiki/File:Eurosport_2_Logo_2015.svg | PD-textlogo |
| `nl-discovery` | Discovery | `assets/channels/nl-discovery.png` | `48010e2b8eb61717088763adaf53a9990978c860f1cb00474c92a22bad1bad34` | Warner Bros. Discovery | https://commons.wikimedia.org/wiki/File:Discovery_Channel_-_Logo_2019.svg | PD-textlogo |
| `nl-national-geographic` | National Geographic | `assets/channels/nl-national-geographic.png` | `6503b9c317270343d4c81f5f887837725b820743c59328d7b3a4422956bd267a` | National Geographic Society | https://commons.wikimedia.org/wiki/File:National_Geographic_Logo.svg | PD-textlogo / trademark |
| `nl-history` | History | `assets/channels/nl-history.png` | `3182c031117d868ee2bca25ec141ca34a81b60eaace7bacfd71335a819b11ed3` | A&E Networks | https://commons.wikimedia.org/wiki/File:History_(2021).svg | PD-textlogo |
| `nl-bbc-nl` | BBC NL | `assets/channels/nl-bbc-nl.png` | `588995b09527100fc25938a41ff3f1fbcb7ff654a0d611f58b4c2574753fe72e` | BBC Studios | https://commons.wikimedia.org/wiki/File:BBC_NL_Logo_2025.svg | Commons file terms / trademark |
| `nl-bbc-one` | BBC One | `assets/channels/nl-bbc-one.png` | `d229c03196976b0931c83a6e509b53d738c490b68d3bb514e888428339ca3b03` | BBC | https://commons.wikimedia.org/wiki/File:BBC_One_logo_2021.svg | Commons file terms / trademark |
| `nl-bbc-two` | BBC Two | `assets/channels/nl-bbc-two.png` | `7be4141938376ba2067b047f592d6be0488bce0a5dfc31b4c9cc4b09806868ee` | BBC | https://commons.wikimedia.org/wiki/File:BBC_Two_logo_2021.svg | Commons file terms / trademark |
| `be-vrt-1` | VRT 1 | `assets/channels/be-vrt-1.png` | `1f5e992ed7a024f1a2fc36d8b68f6e55cc808f56f4b2d52a5c31bceefe96504e` | VRT | https://commons.wikimedia.org/wiki/File:VRT_1_2023.svg | PD-textlogo / trademark |
| `be-vrt-canvas` | VRT Canvas | `assets/channels/be-vrt-canvas.png` | `368fe2fd9bfd7d8f20f638437ed21f4ca457889b52cd3d3bc9520a7dcc923987` | VRT | https://commons.wikimedia.org/wiki/File:VRT_Canvas_logo.svg | PD-textlogo / trademark |
| `be-vtm` | VTM | `assets/channels/be-vtm.png` | `cb30a75c4c62e492a9a1e6a854a4bd9755ed6535dd5ea8a9b336eb723c561efe` | DPG Media | https://commons.wikimedia.org/wiki/File:VTM_logo_2024_(solid_colour).svg | PD-textlogo / trademark |
| `be-play` | Play | `assets/channels/be-play.png` | `c42e0ba112d0b356b3d5229c51825d74d769029df3490b38c8cab903a853748b` | Play Media | https://commons.wikimedia.org/wiki/File:Play_2025.svg | PD-textlogo |
| `be-play-fictie` | Play Fictie | `assets/channels/be-play-fictie.png` | `b5880cf8db9df02a9fb6274f117a11a5267ca3b7c381feb5216d1bf150f285c0` | Play Media | https://commons.wikimedia.org/wiki/File:Play_Fictie_2025.svg | PD-textlogo |
| `be-vtm-2` | VTM2 | `assets/channels/be-vtm-2.png` | `36cba052b1c9653a98139522dab843322f2da6a3bad375d643ee60ffcb7d02c9` | DPG Media | https://commons.wikimedia.org/wiki/File:VTM_2_logo_2024.svg | PD-textlogo / trademark |
| `be-vtm-3` | VTM3 | `assets/channels/be-vtm-3.png` | `28a0af48a9f7e6948d3670cf9886b54bfee328c7f646902b9cc16da7449fa750` | DPG Media | https://commons.wikimedia.org/wiki/File:VTM_3_logo_2024.svg | PD-textlogo / trademark |
| `be-vtm-4` | VTM4 | `assets/channels/be-vtm-4.png` | `799e4572a990d1eb60e7e7751682d0d5a8e4345e611bc3d145021eb013ad3640` | DPG Media | https://commons.wikimedia.org/wiki/File:VTM_4_logo_2024.svg | PD-textlogo / trademark |
| `be-play-actie` | Play Actie | `assets/channels/be-play-actie.png` | `169556208932ff086377d29eb5bf3fa3c6e181b87e434e8d7bd7bd137c4d392c` | Play Media | https://commons.wikimedia.org/wiki/File:Play_Actie_2025.svg | PD-textlogo |
| `be-play-reality` | Play Reality | `assets/channels/be-play-reality.png` | `9c39c1c3b46158d59901acc54018b8d2b062e1f3f51e5897c0e9eca8624cbcdb` | Play Media | https://commons.wikimedia.org/wiki/File:Play_Reality_2025.svg | PD-textlogo |
| `be-play-crime` | Play Crime | `assets/channels/be-play-crime.png` | `6c0b45c4b117721db56f52566b0dc98600640246598de3def890d7e6ec2c69b1` | Play Media | https://commons.wikimedia.org/wiki/File:Play_Crime_2025.svg | PD-textlogo |
| `be-vtm-gold` | VTM Gold | `assets/channels/be-vtm-gold.png` | `19d005d06300395467382b164559254b6f16a5c62a893f7fb9c85d20ab8f5163` | DPG Media | https://commons.wikimedia.org/wiki/File:VTM_Gold_logo_2024.svg | PD-textlogo / trademark |
| `be-ketnet` | Ketnet | `assets/channels/be-ketnet.png` | `9b779815e6c3e855f1ea004d6be00580059a09df8fc37557a6d26446115cd2a1` | VRT | https://commons.wikimedia.org/wiki/File:Ketnet_2021.svg | PD-textlogo / trademark |

## Dark-safe broadcaster-specific variants

Owner physical review #5833155116 established that 17 light/base marks lose required contrast on the accepted dark Guide canvas. Independent QA review #5320776684 then rejected the prior dark-file byte provenance because permission to use a broadcaster mark does not by itself establish commercial redistribution rights in a third-party pack's exact PNG bytes.

The QA fix uses **Pad B — asset replacement**. All 17 prior dark PNG bytes are replaced. The runtime architecture is unchanged: the central canonical-ID keyed manifest/registry still resolves a fixed local PNG for dark appearance, with no runtime tint, recolour, hotlink, generic tile or per-screen mapping.

The rights chain is deliberately split:

- **Broadcaster mark / trademark authority:** Teevee's existing owner-confirmed rights authority remains the basis for using the broadcaster identities. That authority is separate from, and is not inferred from, Commons or a press portal.
- **Exact dark-file byte/copyright authority:** twelve dark PNGs are fixed Teevee-generated raster derivatives of the already-vendored base assets whose underlying source works are recorded above as PD-textlogo/simple-logo or CC0; five Ziggo Sport PNGs are exact files supplied by Ziggo Sport in its public Newsroom logo press kit. No current dark byte is copied from a third-party logo pack.

For the twelve Teevee-generated dark rasters, the transform is build-time and finite: geometry, alpha and broadcaster accent colours remain source-derived; only neutral/dark wordmark pixels are lifted to white for the accepted dark canvas. The generated PNG bytes are vendored and hash-locked. There is no runtime colour transformation and no generator/tooling dependency in the production tree.

Ziggo source page: https://www.ziggosport.nl/nieuws/assets/238870/

| Canonical ID | Dark asset | SHA-256 | Concrete byte/source chain | Copyright / file-rights basis |
| --- | --- | --- | --- | --- |
| `nl-rtl-4` | `assets/channels/dark/nl-rtl-4.png` | `70c20bb2e02c0cdae8299d1ff5ba9e42144532c2875f89d1d89fc0af50a2838d` | `assets/channels/nl-rtl-4.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD/simple-logo |
| `nl-rtl-5` | `assets/channels/dark/nl-rtl-5.png` | `faf645c04e83776ab6cfe550ce7f57756be1f138560d4bd8236e9694f4e32d1b` | `assets/channels/nl-rtl-5.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD/simple-logo |
| `nl-rtl-7` | `assets/channels/dark/nl-rtl-7.png` | `728daf8a338d9c3d7e486f5194ee1150611fb2e073942539541b80608af36dd8` | `assets/channels/nl-rtl-7.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-rtl-8` | `assets/channels/dark/nl-rtl-8.png` | `350f6f08c0869c20657aaedf4b92237d8e4f49d450d1607012402f49f24b6370` | `assets/channels/nl-rtl-8.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-star-channel` | `assets/channels/dark/nl-star-channel.png` | `ed6eefc56d3157779cabfb263f264eb06fbd9fa35d9d2835029485c752f725f2` | `assets/channels/nl-star-channel.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work CC0 1.0 |
| `nl-ziggo-sport-2` | `assets/channels/dark/nl-ziggo-sport-2.png` | `d26a2cc46e964f5b4a29f68f117cb2f96ce50fb15b151581588bffa786255655` | Ziggo Sport Newsroom — Ziggo Sport 402 White Horizontal RGB v1 | Exact broadcaster-supplied PNG; no third-party derivative/pack rights |
| `nl-ziggo-sport-3` | `assets/channels/dark/nl-ziggo-sport-3.png` | `df7a851c78854de4afb2068bd92cdd09210b9f193ad2f65e9c33a422fa4a307a` | Ziggo Sport Newsroom — Ziggo Sport 403 White Horizontal RGB v1 | Exact broadcaster-supplied PNG; no third-party derivative/pack rights |
| `nl-ziggo-sport-4` | `assets/channels/dark/nl-ziggo-sport-4.png` | `46bad5265a5affddf2ab9f3d679f5bc4f0941c490f82c78b6bbe4eff325c84c6` | Ziggo Sport Newsroom — Ziggo Sport 404 White Horizontal RGB v1 | Exact broadcaster-supplied PNG; no third-party derivative/pack rights |
| `nl-ziggo-sport-5` | `assets/channels/dark/nl-ziggo-sport-5.png` | `857fd06924b3d3b9e7276297a53955da1b89c8e4557cd6f40b5bb2d8e9177701` | Ziggo Sport Newsroom — Ziggo Sport 405 White Horizontal RGB v1 | Exact broadcaster-supplied PNG; no third-party derivative/pack rights |
| `nl-ziggo-sport-6` | `assets/channels/dark/nl-ziggo-sport-6.png` | `bf144d842b3a83b8fdb52a673dea5b2f94fad45be178726bddf234ade91c022e` | Ziggo Sport Newsroom — Ziggo Sport 406 White Horizontal RGB v1 | Exact broadcaster-supplied PNG; no third-party derivative/pack rights |
| `nl-viaplay-tv` | `assets/channels/dark/nl-viaplay-tv.png` | `b3de6e15d05e4d1481cdb3e5e4bcaefbe70fda94f185c7be73b85eebaf23b1e5` | `assets/channels/nl-viaplay-tv.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-rtl-z` | `assets/channels/dark/nl-rtl-z.png` | `dbb8a2a7b22edb9f55949042464d8336e6c95f9ca1cb0881178838d5a2390c1e` | `assets/channels/nl-rtl-z.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-comedy-central` | `assets/channels/dark/nl-comedy-central.png` | `248d88ad3235788ee877d849320004fd7d387239ffa52d0fc31892376d74df4e` | `assets/channels/nl-comedy-central.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-eurosport-1` | `assets/channels/dark/nl-eurosport-1.png` | `caecc5937a07b93de0cbee4ab8ccc10927e02af621795de3016f327d0a58d8be` | `assets/channels/nl-eurosport-1.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-eurosport-2` | `assets/channels/dark/nl-eurosport-2.png` | `97bbd94d762052fd872e6fe23b28b2983dddd6887ad383d1d685f6f2fb6e9945` | `assets/channels/nl-eurosport-2.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-discovery` | `assets/channels/dark/nl-discovery.png` | `1869bc7e889b2e4a964f771aac2d200c3bcac8ecddcc878a81e9f4261d265690` | `assets/channels/nl-discovery.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |
| `nl-national-geographic` | `assets/channels/dark/nl-national-geographic.png` | `106e17017c79abf5a7bc02cf1e76d515ec45767d3d5a0a765b5318e8d094cf69` | `assets/channels/nl-national-geographic.png` + fixed Teevee dark-raster transform | Teevee fixed dark raster from base row; source work PD-textlogo |

## Integrity contract

- exactly 49 canonical IDs have exactly 49 light/base local PNG paths;
- 17 owner-identified dark-contrast IDs have explicit dark-safe PNG variants;
- every PNG filename is canonical-ID keyed;
- `SHA256SUMS` contains all 66 runtime PNG byte hashes (49 base + 17 dark);
- CI verifies manifest order, file existence, byte hashes, PNG signature and minimum intrinsic density for the smallest 40x32 identity box;
- the final tree contains no dark-logo download/generator workflow or asset-conversion dependency;
- `react-native-svg` is not required by the final raster-only runtime;
- provider `logoUrl` remains a generic fallback only for non-canonical/fixture identities. Canonical 49-channel rendering resolves local assets first.

## Visual risks that still require physical iPhone acceptance

Automated integrity does not establish visual suitability. The physical gate must explicitly check:

- light, dark and system appearance;
- Per zender, Nu & Straks, Totaal, Search and Mijn zenders identity boxes;
- Larger Text and VoiceOver semantics;
- no clipping/cropping at 40x32 and other accepted bounds;
- the 17 new dark-safe variants on the accepted #10100F-like dark canvas;
- marks containing white wordmarks/suffixes, especially Play Fictie / Actie / Reality / Crime, on the accepted light canvas;
- the Net5 raster, whose source canvas is opaque rather than transparent, for unacceptable visible background boxing.

Do not fix these risks by runtime tinting, recolouring, fabricating a brand mark or placing all marks on a generic tile. If a verified broadcaster-specific alternate asset is required, add it centrally with provenance and update `SHA256SUMS`.

## Production/release boundary

For these 17 dark files, the repository now records a byte/copyright provenance that does not depend on a third-party logo pack: twelve are Teevee-authored fixed raster derivatives of copyright-unrestricted PD/CC0 source works and five are exact broadcaster-supplied Ziggo Sport newsroom PNGs. Broadcaster/trademark use remains governed by the separate existing Teevee rights authority; it is not inferred from Commons or press-kit availability. Programme-data, programme-artwork and provider/SLA rights remain separate release gates.
