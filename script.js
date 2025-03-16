// グローバル変数：JSONデータは配列として読み込む
let pokemonData = [];

// JSONファイルの読み込み
fetch('pokemon_data.json')
  .then(response => response.json())
  .then(data => { pokemonData = data; })
  .catch(err => console.error('JSON読み込みエラー:', err));

// 状態変数（各ボタンのON/OFF状態）
let enemyWeatherActive = false, enemyParalysisActive = false;
let selfWeatherActive = false, scarfActive = false, selfParalysisActive = false;
let enemyRank = 0, selfRank = 0;

// ひらがな→カタカナ変換（簡易版）
const hiraToKana = str => str.replace(/[\u3041-\u3096]/g,
  match => String.fromCharCode(match.charCodeAt(0) + 96)
);

// 検索候補表示（相手側のポケモン名入力欄）
function showSuggestions() {
  let input = document.getElementById("enemyPokemonInput").value.trim();
  let suggestionBox = document.getElementById("enemySuggestionBox");
  suggestionBox.innerHTML = "";
  if (!input) { calculateSpeed(); return; }
  let katakanaInput = hiraToKana(input);
  // JSONは配列なので、部分一致で検索
  let filtered = pokemonData.filter(p => p.name.includes(katakanaInput));
  filtered.slice(0, 3).forEach(p => {
    let div = document.createElement("div");
    div.textContent = p.name;
    div.onclick = function() {
      document.getElementById("enemyPokemonInput").value = p.name;
      suggestionBox.innerHTML = "";
      calculateSpeed();
    };
    suggestionBox.appendChild(div);
  });
  calculateSpeed();
}

// ランク補正乗数（-6～+6）
function rankMultiplier(rank) {
  if (rank > 0) return (2 + rank) / 2;
  if (rank < 0) return 2 / (2 - rank);
  return 1;
}

// ランク調整
function adjustRank(target, change) {
  if (target === "self") {
    selfRank = Math.max(-6, Math.min(6, selfRank + change));
    document.getElementById("selfRank").innerText = selfRank;
  } else {
    enemyRank = Math.max(-6, Math.min(6, enemyRank + change));
    document.getElementById("enemyRank").innerText = enemyRank;
  }
  calculateSpeed();
}

// ボタンのON/OFF切替（active クラスで色付け）  
function toggleEnemyWeather(button) {
  enemyWeatherActive = !enemyWeatherActive;
  button.classList.toggle("active", enemyWeatherActive);
  calculateSpeed();
}
function toggleEnemyParalysis(button) {
  enemyParalysisActive = !enemyParalysisActive;
  button.classList.toggle("active", enemyParalysisActive);
  calculateSpeed();
}
function toggleSelfWeather(button) {
  selfWeatherActive = !selfWeatherActive;
  button.classList.toggle("active", selfWeatherActive);
  calculateSpeed();
}
function toggleScarf(button) {
  scarfActive = !scarfActive;
  button.classList.toggle("active", scarfActive);
  calculateSpeed();
}
function toggleSelfParalysis(button) {
  selfParalysisActive = !selfParalysisActive;
  button.classList.toggle("active", selfParalysisActive);
  calculateSpeed();
}

// 各ボタンの呼び出し用ラッパー関数
function toggleButton(button, type) {
  switch(type) {
    case 'enemyWeather': toggleEnemyWeather(button); break;
    case 'enemyParalysis': toggleEnemyParalysis(button); break;
    case 'selfWeather': toggleSelfWeather(button); break;
    case 'scarf': toggleScarf(button); break;
    case 'selfParalysis': toggleSelfParalysis(button); break;
  }
}

// 計算処理
function calculateSpeed() {
  // --- 敵側 ---\n  相手のポケモン名（ひらがな対応）から該当データを取得\n
  let enemyName = document.getElementById("enemyPokemonInput").value.trim();
  if (!enemyName) {\n    document.getElementById("result").innerHTML = "";\n    return;\n  }\n  let enemyKey = hiraToKana(enemyName);\n  let enemyData = pokemonData.find(p => p.name.includes(enemyKey));\n  if (!enemyData) { document.getElementById(\"result\").innerHTML = \"\"; return; }\n  \n  // 敵側基本実数値 = basespeed + 52\n  let baseStat = enemyData.basespeed + 52;\n  // ランク補正\n  baseStat *= rankMultiplier(enemyRank);\n  // 状態補正： 天候＝×2、まひ＝×0.5\n  let enemyCondition = (enemyWeatherActive ? 2 : 1) * (enemyParalysisActive ? 0.5 : 1);\n  let enemyEffective = baseStat * enemyCondition;\n  \n  // 6パターンの敵側素早さ\n  let enemyResults = {\n    \"最速スカーフ\": Math.floor(enemyEffective * 1.5 * 1.1),\n    \"準速スカーフ\": Math.floor(enemyEffective * 1.5),\n    \"最速\": Math.floor(enemyEffective * 1.1),\n    \"準速\": Math.floor(enemyEffective),\n    \"無振り\": Math.floor(enemyEffective * 0.9),\n    \"最遅\": Math.floor(enemyEffective * 0.5)\n  };\n\n  // --- 自分側 ---\n  // ユーザーが入力した実数値を最終ステータスとみなす\n  let selfInput = document.getElementById("selfSpeedInput").value;\n  let selfComputed = null;\n  if (selfInput !== \"\") {\n    selfComputed = parseFloat(selfInput);\n    selfComputed *= rankMultiplier(selfRank);\n    selfComputed *= (selfWeatherActive ? 2 : 1);\n    selfComputed *= (scarfActive ? 1.5 : 1);\n    selfComputed *= (selfParalysisActive ? 0.5 : 1);\n    selfComputed = Math.floor(selfComputed);\n  }\n\n  // --- 結果表示 ---\n  let resultHTML = \"\";\n  for (let key in enemyResults) {\n    let enemyVal = enemyResults[key];\n    let bgColor = \"transparent\";\n    if (selfComputed !== null) {\n      if (selfComputed > enemyVal) bgColor = \"rgba(255, 0, 0, 0.3)\";      // 自分が速い → 薄い赤\n      else if (selfComputed === enemyVal) bgColor = \"rgba(255, 255, 0, 0.3)\"; // 同速 → 薄い黄\n      else bgColor = \"rgba(0, 0, 255, 0.3)\";                                // 自分が遅い → 薄い青\n    }\n    resultHTML += `<div class='result-row' style='background:${bgColor};'>` +\n                  `<span>${key}</span><span>${enemyVal}</span></div>`;\n  }\n  if (selfComputed !== null) {\n    resultHTML += `<div class='result-row self-result'>自分の素早さ: ${selfComputed}</div>`;\n  }\n  document.getElementById(\"result\").innerHTML = resultHTML;\n}\n\n// ※ HTML側の各ボタンは、onclickで toggleButton(this, type) または個別関数を呼び出すように設定してください。\n"}
