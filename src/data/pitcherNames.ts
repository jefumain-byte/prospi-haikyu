export interface PitcherCandidate {
  name: string
  reading: string
}

export interface PitcherSuggestionGroup {
  label: string
  candidates: PitcherCandidate[]
}

/** 先発 — 表示名（漢字・カタカナ） */
const STARTING_PITCHER_RAW = `大関 友久,モイネロ,上沢 直之,斉藤 和巳,松本 晴,大津 亮介,千賀 滉大,板東 湧梧,和田 毅,前田 悠伍,山田 大樹,攝津 正,スチュワートJR.,有原 航平,村上 泰斗,工藤 公康,大隣 憲司,加藤 貴之,伊藤 大海,北山 亘基,金村 尚真,達 孝太,大谷 翔平,グリン,バーヘイゲン,ダルビッシュ 有,木田 勇,山﨑 福也,柴田 獅子,古林 睿煬,金子 千尋,エスピノーザ,宮城 大弥,九里 亜蓮,藤川 敦也,山下 舜平大,曽谷 龍平,田嶋 大樹,寺西 成騎,椋木 蓮,山本 由伸,梶本 隆夫,西 勇輝,岸 孝之,藤井 聖,古謝 樹,藤原 聡大,涌井 秀章,荘司 康誠,瀧中 瞭太,早川 隆久,大内 誠弥,岩隈 久志,田中 将大,内 星龍,ヤフーレ,ハワード,髙橋 光成,隅田 知一郎,武内 夏暉,今井 達也,平良 海馬,渡邉 勇太朗,上田 大河,杉山 遙希,松坂 大輔,郭 泰源,菊池 雄星,石井 貴,西口 文也,田中 晴也,種市 篤暉,小島 和哉,石垣 元気,石川 柊太,ボス,廣池 康志郎,西野 勇士,村田 兆治,サモンズ,石川 歩,大竹 耕太郎,村上 頌樹,才木 浩人,伊原 陵人,伊藤 将司,今朝丸 裕喜,村山 実,井川 慶,門別 啓人,スタンリッジ,岩田 稔,能見 篤史,デュプランティエ,安藤 優也,竹田 祐,東 克樹,石田 裕太郎,バウアー,ジャクソン,小園 健太,井納 翔一,秋山 登,ケイ,平良 拳太郎,大貫 晋一,三浦 大輔,今永 昇太,井上 温大,山﨑 伊織,戸郷 翔征,竹丸 和幸,横川 凱,グリフィン,赤星 優志,槙原 寛己,上原 浩治,杉内 俊哉,菅野 智之,内海 哲也,金丸 夢斗,髙橋 宏斗,大野 雄大,中西 聖輝,松葉 貴大,柳 裕也,メヒア,星野 仙一,福谷 浩司,小笠原 慎之介,森下 暢仁,床田 寛樹,大瀬良 大地,森 翔平,髙 太一,佐藤 柳之介,外木場 義郎,ジョンソン,前田 健太,玉村 昇悟,北別府 学,大竹 寛,ドミンゲス,小林 幹英,高橋 奎二,吉村 貢司郎,小川 泰弘,ランバート,高梨 裕稔,山野 太一,ホッジス,下川 隼佑,奥川 恭伸,グライシンガー,中村 優斗,由規`

/** 先発 — 読み（ひらがな） */
const STARTING_PITCHER_READING_RAW = `おおぜき ともひさ,もいねろ,うわさわ なおゆき,さいとう かずみ,まつもと はる,おおつ りょうすけ,せんが こうだい,ばんどう ゆうご,わだ つよし,まえだ ゆうご,やまだ ひろき,せっつ ただし,すちゅわーとじゅにあ,ありはら こうへい,むらかみ たいと,くどう きみやす,おおとなり けんじ,かとう たかゆき,いとう ひろみ,きたやま こうき,かねむら しょうま,たつ こうた,おおたに しょうへい,ぐりん,ばーへいげん,だるびっしゅ ゆう,きだ いさむ,やまさき さちや,しばた れお,ぐーりん るいやん,かねこ ちひろ,えすぴのーざ,みやぎ ひろや,くり あれん,ふじかわ あつや,やました しゅんぺいた,そたに りゅうへい,たじま だいき,てらにし なるき,むくのき れん,やまもと よしのぶ,かじもと たかお,にし ゆうき,きし たかゆき,ふじい まさる,こじゃ たつき,ふじわら そうた,わくい ひであき,しょうじ こうせい,たきなか りょうた,はやかわ たかひさ,おおうち せいや,いわくま ひさし,たなか まさひろ,うち せいりゅう,やふーれ,はわーど,たかはし こうな,すみだ ちひろ,たけうち なつき,いまい たつや,たいら かいま,わたなべ ゆうたろう,うえだ たいが,すぎやま はるき,まつざか だいすけ,かく たいげん,きくち ゆうせい,いしい たかし,にしぐち ふみや,たなか はれるや,たねいち あつき,おじま かずや,いしがき げんき,いしかわ しゅうた,ぼす,ひろいけ こうしろう,にしの ゆうじ,むらた ちょうじ,さもんず,いしかわ あゆむ,おおたけ こうたろう,むらかみ しょうき,さいき ひろと,いはら たかと,いとう まさし,けさまる ゆうき,むらやま みのる,いがわ けい,もんべつ けいと,すたんりっじ,いわた みのる,のうみ あつし,でゅぷらんてぃえ,あんどう ゆうや,たけだ ゆう,あずま かつき,いしだ ゆうたろう,ばうあー,じゃくそん,こぞの けんた,いのう しょういち,あきやま のぼる,けい,たいら けんたろう,おおぬき しんいち,みうら だいすけ,いまなが しょうた,いのうえ はると,やまざき いおり,とごう しょうせい,たけまる かずゆき,よこがわ かい,ぐりふぃん,あかほし ゆうじ,まきはら ひろみ,うえはら こうじ,すぎうち としや,すがの ともゆき,うつみ てつや,かねまる ゆめと,たかはし ひろと,おおの ゆうだい,なかにし まさき,まつば たかひろ,やなぎ ゆうや,めひあ,ほしの せんいち,ふくたに こうじ,おがさわら しんのすけ,もりした まさと,とこだ ひろき,おおせら だいち,もり しょうへい,たか たいち,さとう りゅうのすけ,そとこば よしろう,じょんそん,まえだ けんた,たまむら しょうご,きたべっぷ まなぶ,おおたけ かん,どみんげす,こばやし かんえい,たかはし けいじ,よしむら こうじろう,おがわ やすひろ,らんばーと,たかなし ひろとし,やまの たいち,ほっじす,しもかわ しゅんすけ,おくがわ やすのぶ,ぐらいしんがー,なかむら ゆうと,よしのり`

/** 中継ぎ・抑え — 表示名 */
const RELIEF_PITCHER_RAW = `藤井 皓哉,ヘルナンデス,松本 裕樹,稲川 竜汰,杉山 一樹,中村 稔弥,オスナ,尾形 崇斗,森福 允彦,五十嵐 亮太,津森 宥紀,上茶谷 大河,甲斐野 央,又吉 克樹,玉井 大翔,齋藤 友貴哉,田中 正義,大川 慈英,堀 瑞輝,菊地 大稀,池田 隆英,河野 竜生,柳川 大晟,宮西 尚生,増井 浩俊,杉浦 稔大,榊原 諒,建山 義紀,岩嵜 翔,生田目 翼,ペルドモ,古田島 成龍,才木 海翔,マチャド,川瀬 堅斗,山田 修義,山岡 泰輔,博志,赤堀 元之,岸田 護,本田 圭佑,阿部 翔太,西垣 雅矢,加治屋 蓮,比嘉 幹貴,藤平 尚真,則本 昂大,西口 直人,江原 雅裕,松井 裕樹,鈴木 翔天,斎藤 隆,ハウザー,ラズナー,福山 博之,酒居 知史,津留﨑 大成,今野 龍太,柴田 大地,渡辺 翔太,山田 陽翔,E.ラミレス,牧田 和久,黒木 優太,髙橋 朋己,ウィンゲンター,水上 由伸,田村 伊知郎,佐藤 隼輔,小野 郁,鈴木 昭汰,豊田 清,松永 昂大,木村 優人,高野 脩汰,八木 彬,横山 陸人,ゲレーロ,小宮山 悟,益田 直也,木樽 正明,澤村 拓一,菊地 吏玖,国吉 佑樹,湯浅 京己,石井 大智,及川 雅貴,桐敷 拓馬,岩崎 優,藤川 球児,岡留 英貴,ゲラ,ドリス,ビーズリー,畠 世周,島本 浩也,坂本 裕哉,ルイーズ,榎田 大樹,山﨑 康晃,ウィック,宮城 滝太,伊勢 大夢,森原 康平,入江 大生,浜地 真澄,ディアス,颯,中川 皓太,田中 瑛斗,三嶋 一輝,松浦 慶斗,船迫 大雅,大勢,マシソン,岡島 秀樹,石川 達也,ケラー,高梨 雄平,バルドナード,齋藤 網記,藤嶋 健人,アブレイユ,マルテ,松山 晋也,福 敬登,近藤 廉,ロドリゲス,清水 達也,勝野 昌慶,伊藤 茉央,橋本 侑樹,中﨑 翔太,ハーン,浅尾 拓也,森浦 大輔,栗林 良吏,島内 颯太郎,長谷部 銀次,レグナルト,塹江 敦哉,荘司 宏太,鈴木 健矢,拓也,大西 広樹,石山 泰雅,小澤 怜史,田口 麗斗,大道 温貴,木田 優夫,木澤 尚文,石原 勇輝,バウマン,高津 臣吾,矢崎 拓也`

/** 中継ぎ・抑え — 読み（ひらがな） */
const RELIEF_PITCHER_READING_RAW = `ふじい こうや,へるなんです,まつもと ゆうき,いながわ りゅうた,すぎやま かずき,なかむら としや,おすな,おがた しゅうと,もりふく まさひこ,いがらし りょうた,つもり ゆうき,かみちゃたに たいが,かいの ひろし,またよし かつき,たまい たいしょう,さいとう ゆきや,たなか せいぎ,おおかわ じぇい,ほり みずき,きくち たいき,いけだ たかひで,かわの りゅうせい,やながわ たいせい,みやにし なおき,ますい ひろとし,すぎうら としひろ,さかきばら りょう,たてやま よしのり,いわさき しょう,なばため つばさ,ぺるども,こたじま せいりゅう,さいき かいと,まちゃど,かわせ けんと,やまだ のぶよし,やまおか たいすけ,ひろし,あかほり もとゆき,きしだ まもる,ほんだ けいすけ,あべ しょうた,にしがき まさや,かじや れん,ひが もとき,ふじひら しょうま,のりもと たかひろ,にしぐち なおと,えはら まさひろ,まつい ゆうき,すずき そら,さいとう たかし,はうざー,らずなー,ふくやま ひろゆき,さかい ともひと,つるさき たいせい,こんの りゅうた,しばた だいち,わたなべ しょうた,やまだ はると,いー・らみれす,まきた かずひさ,くろき ゆうた,たかはし ともみ,うぃんげんたー,みずかみ よしのぶ,たむら いちろう,さとう しゅんすけ,おの ふみや,すずき しょうた,とよだ きよし,まつなが たかひろ,きむら ゆうと,たかの しゅうた,やぎ あきら,よこやま りくと,げれーろ,こみやま さとる,ますだ なおや,きたる まさあき,さわむら ひろかず,きくち りく,くによし ゆうき,ゆあさ あつき,いしい だいち,およかわ まさき,きりしき たくま,いわざき すぐる,ふじかわ きゅうじ,おかどめ ひでたか,げら,どりす,びーずりー,はたけ せいしゅう,しまもと ひろや,さかもと ゆうや,るいーず,えのきだ だいき,やまさき やすあき,うぃっく,みやぎ だいた,いせ ひろむ,もりはら こうへい,いりえ たいせい,はまち ますみ,でぃあす,はやて,なかがわ こうた,たなか えいと,みしま かずき,まつうら けいと,ふなばさま ひろまさ,たいせい,ましそん,おかじま ひでき,いしかわ たつや,けらー,たかなし ゆうへい,ばるどなーど,さいとう こうき,ふじしま けんと,あぶれいゆ,まるて,まつやま しんや,ふく ひろと,こんどう れん,ろどりげす,しみず たつや,かつの あきよし,いとう まお,はしもと ゆうき,なかざき しょうた,はーん,あさお たくや,もりうら だいすけ,くりばやし りょうじ,しまうち そうたろう,はせべ ぎんじ,れぐなると,ほりえ あつや,しょうじ こうた,すずき けんや,たくや,おおにし ひろき,いしやま たいが,こざわ れいじ,たぐち かずと,おおみち はるき,きだ まさお,きざわ なおふみ,いしはら ゆうき,ばうまん,たかつ しんご,やざき たくや`

function parseList(raw: string): string[] {
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

function buildLinkedPitchers(namesRaw: string, readingsRaw: string, label: string): readonly PitcherCandidate[] {
  const names = parseList(namesRaw)
  const readings = parseList(readingsRaw)
  if (names.length !== readings.length) {
    throw new Error(`${label}: 名前 ${names.length} 件 / 読み ${readings.length} 件`)
  }
  return names.map((name, index) => ({ name, reading: readings[index] }))
}

const STARTING_PITCHERS = buildLinkedPitchers(STARTING_PITCHER_RAW, STARTING_PITCHER_READING_RAW, '先発')
const RELIEF_PITCHERS = buildLinkedPitchers(RELIEF_PITCHER_RAW, RELIEF_PITCHER_READING_RAW, '中継ぎ・抑え')

export const STARTING_PITCHER_NAMES = STARTING_PITCHERS.map((pitcher) => pitcher.name)
export const RELIEF_PITCHER_NAMES = RELIEF_PITCHERS.map((pitcher) => pitcher.name)

export const PITCHER_NAME_GROUPS = [
  { label: '先発', pitchers: STARTING_PITCHERS },
  { label: '中継ぎ・抑え', pitchers: RELIEF_PITCHERS },
] as const

const ALL_PITCHERS: readonly PitcherCandidate[] = [...STARTING_PITCHERS, ...RELIEF_PITCHERS]

/** 旧表記 → 正式名 */
const PITCHER_NAME_ALIASES: Record<string, string> = {
  '金子 弌大': '金子 千尋',
}

export function normalizePitcherName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed
  return PITCHER_NAME_ALIASES[trimmed] ?? trimmed
}

function normalizeSearchText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '')
}

function matchesCandidate(candidate: PitcherCandidate, query: string): boolean {
  if (!query) return true
  const normalizedQuery = normalizeSearchText(query)
  return (
    normalizeSearchText(candidate.name).includes(normalizedQuery) ||
    normalizeSearchText(candidate.reading).includes(normalizedQuery)
  )
}

export function filterPitcherNameSuggestions(query: string, limit = 12): PitcherSuggestionGroup[] {
  return PITCHER_NAME_GROUPS.map((group) => ({
    label: group.label,
    candidates: group.pitchers.filter((candidate) => matchesCandidate(candidate, query)).slice(0, limit),
  })).filter((group) => group.candidates.length > 0)
}

/** 入力値を表示名（漢字・カタカナ）に解決。読みが一意のときのみ変換 */
export function resolvePitcherName(input: string): string {
  const trimmed = normalizePitcherName(input)
  if (!trimmed) return trimmed

  const byExactName = ALL_PITCHERS.filter((candidate) => candidate.name === trimmed)
  if (byExactName.length === 1) return byExactName[0].name

  const byExactReading = ALL_PITCHERS.filter((candidate) => candidate.reading === trimmed)
  if (byExactReading.length === 1) return byExactReading[0].name

  const normalizedInput = normalizeSearchText(trimmed)
  const byNormalizedReading = ALL_PITCHERS.filter(
    (candidate) => normalizeSearchText(candidate.reading) === normalizedInput,
  )
  if (byNormalizedReading.length === 1) return byNormalizedReading[0].name

  return trimmed
}

export function findPitcherByInput(input: string): PitcherCandidate | null {
  const resolved = resolvePitcherName(input)
  return ALL_PITCHERS.find((candidate) => candidate.name === resolved) ?? null
}
