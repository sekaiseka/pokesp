// JSONデータを格納
let pokemonData = [];

// GitHub Pages の JSON の URL（USERNAME と REPOSITORY は適宜変更）
const jsonURL = "https://sekaiseka.github.io/pokesp/pokemon_data.json";

// JSONデータの取得
fetch(jsonURL)
  .then(response => response.json())
  .then(data => { 
    pokemonData = data; 
    console.log("JSONデータを取得しました:", pokemonData);
  })
  .catch(err => console.error('JSON読み込みエラー:', err));

// **ひらがな → カタカナ変換（簡易版）**
const hiraToKana = str => str.replace(/[\u3041-\u3096]/g,
  match => String.fromCharCode(match.charCodeAt(0) + 96)
);

// **ポケモン名を正規化**
function normalizeName(name) {
  return name
    .replace(/\n/g, "")            // 改行を削除
    .replace(/\(/g, "（")          // 半角カッコ → 全角カッコ
    .replace(/\)/g, "）")          // 半角カッコ → 全角カッコ
    .replace(/[（）]/g, "")       // 全角カッコを削除
    .trim();                       // 前後の空白削除
}

// **検索候補の表示**
function showSuggestions() {
  let input = document.getElementById("enemyPokemonInput").value.trim();
  let suggestionBox = document.getElementById("enemySuggestionBox");
  suggestionBox.innerHTML = "";
  if (!input) { calculateSpeed(); return; }

  let normalizedInput = normalizeName(hiraToKana(input));

  // **検索候補を取得（正規化後の名前を比較）**
  let filtered = pokemonData.filter(p => normalizeName(p.name).includes(normalizedInput));

  // **一致したポケモンをすべて表示**
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

// **計算処理**
function calculateSpeed() {
  let enemyName = document.getElementById("enemyPokemonInput").value.trim();
  if (!enemyName) {
    document.getElementById("result").innerHTML = "";
    return;
  }

  let normalizedEnemyName = normalizeName(hiraToKana(enemyName));

  // **JSON内のポケモン名も正規化して検索**
  let enemyData = pokemonData.find(p => normalizeName(p.name) === normalizedEnemyName);

  if (!enemyData) {
    document.getElementById("result").innerHTML = "";
    return;
  }

  let baseStat = enemyData.basespeed + 52;
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
