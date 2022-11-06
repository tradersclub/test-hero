const fs = require('fs');
const readline = require('readline');

const re = new RegExp(
  /<(?!\/|html|head|title|meta|script|href|style|link|noscript|boolean)(?![^>]*\btest-id\b)>*[^<]*[^}]/,
  'gm'
);

const varDeclaration = new RegExp(
  /^(\t)?(\s)*(const|var|let) \w+ = [a-zA-Z]/,
  'g'
);

const enclosing = new RegExp(/(\/?>}|\/?>)[\n ]*$/, '');

const file = readline.createInterface({
  input: fs.createReadStream('./index.js'),
  output: process.stdout,
  terminal: false,
});

var newFile = '';
var newLine = '';
var openTag = false;
var lineNumber = 0;

file.on('line', (line) => {
  lineNumber += 1;
  var offsetChanges = 0;

  // It is probably not a tag
  if (!re.test(line) && !openTag) {
    console.log(lineNumber, '-- not a tag');
    newFile += line + '\n';
    return;
  }

  // It is a constant declaration
  if (varDeclaration.test(line) && !openTag) {
    console.log(lineNumber, '-- a declaration');
    newFile += line + '\n';
    return;
  }

  // It is probably a tag, but has no enclosing
  if (!hasEnclosing) {
    console.log(lineNumber, '-- grouping');
    openTag = true;
    newLine += line + '\n';
    return;
  }

  newLine += line;
  console.log(lineNumber, '-- ending');
  // console.log(newLine);
  console.log(newLine.match(re));

  for (const match of newLine.matchAll(re)) {
    var newTag = match[0];
    const start = match.index;
    const end = newTag.length;

    console.log('-- match');
    console.log(match);

    const beforeClose = newTag.substring(end - 2, end - 1);
    const newTestId = `test-id="${Math.random()
      .toString(16)
      .substring(2, 12)}"`;

    var positionCut = end - 1;
    if (beforeClose === '/') positionCut -= 1;

    newTag = [
      newTag.slice(0, positionCut),
      newTag.slice(positionCut - 1, positionCut) === ' ' ? '' : ' ', // Add space in case test-id is connected to attribute or tag
      newTestId,
      newTag.slice(positionCut),
    ].join('');

    const concatLine = [
      newLine.slice(0, start + offsetChanges),
      newTag,
      newLine.slice(offsetChanges + start + match[0].length),
    ].join('');

    offsetChanges = concatLine.length - line.length;
    newLine = concatLine;
  }

  newFile += newLine + '\n';
  newLine = '';
  openTag = false;
});

file.on('close', () => {
  fs.writeFile('./output.js', newFile, () => {
    console.log('Done');
  });
});
