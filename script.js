// Normalization Logic
function normalizeArabicText(text) {
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '');
  text = text.replace(/[^\u0621-\u064A\u0660-\u0669A-Za-z\s\d]+/g, '');
  return text.trim();
}

function removeRepeatedLetters(word) {
  let newWord = "";
  let count = 1;

  for (let i = 0; i < word.length - 1; i++) {
    if (word[i] === word[i + 1]) {
      count++;
    } else {
      if (count > 2) {
        newWord += word[i];
      } else {
        newWord += word[i].repeat(count);
      }
      count = 1;
    }
  }

  if (count > 2) {
    newWord += word[word.length - 1];
  } else {
    newWord += word[word.length - 1].repeat(count);
  }

  return newWord;
}

function replaceDaysMonth(word) {
  const replacements = {
    'lundi': 'الاثنين', 'mardi': 'الثلاثاء', 'mercredi': 'الاربعاء', 'jeudi': 'الخميس',
    'vendredi': 'الجمعة', 'samedi': 'السبت', 'dimanche': 'الاحد', 'janvier': 'جانفي',
    'février': 'فيفري', 'mars': 'مارس', 'avril': 'افريل', 'mai': 'ماي', 'juin': 'جوان',
    'juillet': 'جويلية', 'août': 'اوت', 'septembre': 'سبتمبر', 'octobre': 'اوكتوبر',
    'novembre': 'نوفمبر', 'décembre': 'ديسمبر'
  };
  return replacements[word] || word;
}

const t1 = {
  'A': 'ا', 'a': 'ا', '<': 'إ', '|': 'آ', '}': 'ئ', 'p': 'ب', 'پ': 'ب', '>': 'أ', 'b': 'ب',
  't': 'ت', 'v': 'ف', 'j': 'ج', 'H': 'ح', '7': 'ح', 'x': '', '5': 'خ', 'd': 'د', '*': 'ذ',
  'r': 'ر', 'z': 'ز', 's': 'س', 'S': 'ص', 'D': 'ض', 'T': 'ط', 'Z': 'ظ', 'E': 'ع', 'e': '',
  'u': '', '3': 'ع', 'g': 'غ', 'f': 'ف', 'q': 'ق', 'ڨ': 'ق', '9': 'ق', 'k': 'ك', 'l': 'ل',
  'm': 'م', 'n': 'ن', 'ﻧ': 'ن', 'h': 'ه', 'w': 'و', 'W': 'و', 'o': 'و', 'i': 'ي', 'y': 'ي'
};

function subst(word) {
  word = word.replace("ch", "ش").replace("gh", "غ").replace("kh", "خ");
  return word.split('').map(char => t1[char] || char).join('');
}

function buckwalter(text) {
  return text.split(' ').map(word => /^\d+$/.test(word) ? word : subst(word)).join(' ');
}

function normalizeText(text) {
  text = normalizeArabicText(text);
  text = buckwalter(text);
  text = text.split(' ').map(word => removeRepeatedLetters(word)).join(' ');
  return text;
}

// Segmentation Logic
const prefixes = ['ت', 'ي', 'و', 'ا', 'أ', 'ن', 'م', 'ب', 'ل', 'ف', 'ال', 'تت', 'يت', 'فل', 'لي', 'است', 'فال', 'تن', 'ين', 'نت', 'بال'];
const suffixes = ['ت', 'ي', 'ه', 'و', 'ك', 'ة', 'ش', 'نا', 'هم', 'كم', 'ها', 'ين', 'ات', 'ني', 'لهم', 'لكم', 'لنا', 'لها', 'وا', 'ان'];

let rootWords = []; // Load from root_words.txt
let noneWords = []; // Load from none.txt

// Load root words and none words
fetch('data/root_words.txt')
  .then(response => response.text())
  .then(data => rootWords = data.split('\n').map(word => word.trim()));

fetch('data/none.txt')
  .then(response => response.text())
  .then(data => noneWords = data.split('\n').map(word => word.trim()));

function tokenize(word) {
  let tstPr = false;
  let tstSf = false;

  if (!rootWords.includes(word) && !noneWords.includes(word)) {
    let t = true;
    let tst = '';

    for (let l of word) {
      tst += l;

      if (prefixes.includes(tst) && rootWords.includes(word.slice(tst.length))) {
        t = false;
        tstPr = true;
        return word.slice(0, tst.length) + '+' + word.slice(tst.length);
      }

      if (rootWords.includes(tst) && suffixes.includes(word.slice(tst.length))) {
        t = false;
        tstSf = true;
        return word.slice(0, tst.length) + '+' + word.slice(tst.length);
      }

      if (prefixes.includes(tst) && !prefixes.includes(word)) {
        let ha = word.slice(tst.length);
        let tst2 = '';

        for (let i of ha) {
          tst2 += i;
          if (rootWords.includes(tst2) && suffixes.includes(ha.slice(tst2.length))) {
            t = false;
            tstSf = true;
            tstPr = true;
            return word.slice(0, tst.length) + '+' + word.slice(tst.length, tst.length + tst2.length) + '+' + word.slice(tst.length + tst2.length);
          }
        }
      }
    }

    if (t) {
      if (word.length > 3 && (word.endsWith('ش') && (word.startsWith('ما') || word.startsWith('م')))) {
        return word.slice(0, 2) + '+' + tokenize(word.slice(2, -1)) + '+' + 'ش';
      }
    }
  }

  return word;
}

function segment(text) {
  text = normalizeText(text);
  let allWords = text.split(' ');
  let result = allWords.map(word => tokenize(word)).join(' ');
  return result;
}

// UI Functions
function segmentText() {
  const inputText = document.getElementById('inputText').value;
  const segmentedText = segment(inputText);
  document.getElementById('result').innerHTML = segmentedText;
}

function segmentFile() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.txt';

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      const segmentedText = segment(fileContent);
      document.getElementById('result').innerHTML = segmentedText;

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        document.getElementById('progressBar').value = progress;
        if (progress >= 100) clearInterval(interval);
      }, 100);
    };

    reader.readAsText(file);
  };

  fileInput.click();
}
