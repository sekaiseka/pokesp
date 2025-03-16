// JSONデータを格納
let pokemonData = [];

// GitHub Pages 用にJSONのURLを指定（USERNAME, REPOSITORY を適宜変更）
const jsonURL = "https://sekaiseka.github.io/pokesp/pokemon_data.json";

// JSONファイルの読み込み
fetch(jsonURL)
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

// **ポケモン名を正規化（改行を削除し、括弧の中身を結合）**
function normalizeName(name) {
  return name.replace(/\n/g, "").replace(/[()]/g, "").trim();
}

// **検索候補表示**
function showSuggestions() {
  let input = document.getElementById("enemyPokemonInput").value.trim();
  let suggestionBox = document.getElementById("enemySuggestionBox");
  suggestionBox.innerHTML = "";
  if (!input) { calculateSpeed(); return; }

  let normalizedInput = normalizeName(hiraToKana(input));
  let filtered = pokemonData.filter(p => normalizeName(p.name).includes(normalizedInput));

  // **すべての一致候補を表示**
  filtered.forEach(p => {
    let div = document.createElement("div");
    div.textContent = p.name;
    div.onclick = function () {
      document.getElementById("enemyPokemonInput").value = p.name;
      suggestionBox.innerHTML = "";
      calculateSpeed();
    };
    suggestionBox.appendChild(div);
  });

  calculateSpeed();
}

// **ランク補正乗数（-6～+6）**
function rankMultiplier(rank) {
  if (rank > 0) return (2 + rank) / 2;
  if (rank < 0) return 2 / (2 - rank);
  return 1;
}

// **ランク調整**
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

// **各ボタンのON/OFF切替**
function toggleButton(button, type) {
  button.classList.toggle("active");
  switch (type) {
    case 'enemyWeather': enemyWeatherActive = !enemyWeatherActive; break;
    case 'enemyParalysis': enemyParalysisActive = !enemyParalysisActive; break;
    case 'selfWeather': selfWeatherActive = !selfWeatherActive; break;
    case 'scarf': scarfActive = !scarfActive; break;
    case 'selfParalysis': selfParalysisActive = !selfParalysisActive; break;
  }
  calculateSpeed();
}

// **計算処理**
function calculateSpeed() {
  let enemyName = document.getElementById("enemyPokemonInput").value.trim();
  if (!enemyName) {
    document.getElementById("result").innerHTML = "";
    return;
  }
  
  let normalizedEnemyName = normalizeName(hiraToKana(enemyName));
  let enemyData = pokemonData.find(p => normalizeName(p.name) === normalizedEnemyName);
  if (!enemyData) {
    document.getElementById("result").innerHTML = "";
    return;
  }

  let baseStat = enemyData.basespeed + 52;
  baseStat *= rankMultiplier(enemyRank);

  let enemyCondition = (enemyWeatherActive ? 2 : 1) * (enemyParalysisActive ? 0.5 : 1);
  let enemyEffective = baseStat * enemyCondition;

  let enemyResults = {
    "最速スカーフ": Math.floor(enemyEffective * 1.5 * 1.1),
    "準速スカーフ": Math.floor(enemyEffective * 1.5),
    "最速": Math.floor(enemyEffective * 1.1),
    "準速": Math.floor(enemyEffective),
    "無振り": Math.floor(enemyEffective * 0.9),
    "最遅": Math.floor(enemyEffective * 0.5)
  };

  let selfInput = document.getElementById("selfSpeedInput").value;
  let selfComputed = null;
  if (selfInput !== "") {
    selfComputed = parseFloat(selfInput);
    selfComputed *= rankMultiplier(selfRank);
    selfComputed *= (selfWeatherActive ? 2 : 1);
    selfComputed *= (scarfActive ? 1.5 : 1);
    selfComputed *= (selfParalysisActive ? 0.5 : 1);
    selfComputed = Math.floor(selfComputed);
  }

  let resultHTML = "";
  for (let key in enemyResults) {
    let enemyVal = enemyResults[key];
    let bgColor = "transparent";
    if (selfComputed !== null) {
      if (selfComputed > enemyVal) bgColor = "rgba(255, 0, 0, 0.3)";
      else if (selfComputed === enemyVal) bgColor = "rgba(255, 255, 0, 0.3)";
      else bgColor = "rgba(0, 0, 255, 0.3)";
    }
    resultHTML += `<div class='result-row' style='background:${bgColor};'><span>${key}</span><span>${enemyVal}</span></div>`;
  }
  if (selfComputed !== null) {
    resultHTML += `<div class='result-row self-result'>自分の素早さ: ${selfComputed}</div>`;
  }
  document.getElementById("result").innerHTML = resultHTML;
}
