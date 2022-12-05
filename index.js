const fs = require('fs');
const readline = require('readline');

const re = new RegExp(
  /<(?!\/|html|head|title|meta|script|href|style|link|noscript|boolean)(?![^>]*\btest-id\b)>*[^<]*[^}]/,
  'g'
);

const varDeclaration = new RegExp(
  /^(\t)?(\s)*(const|var|let) \w+ = [a-zA-Z]/,
  'g'
);

const enclosing = new RegExp(/(\/?>}|\/?>)[\n ]*$/, '');

exports.parseTestId = function () {
  const file = readline.createInterface({
    input: fs.createReadStream(process.argv[2]),
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
    const hasEnclosing = enclosing.test(line);

    if (!re.test(line) && !openTag) {
      newFile += line + '\n';
      return;
    }

    if (varDeclaration.test(line) && !openTag) {
      newFile += line + '\n';
      return;
    }

    if (!hasEnclosing) {
      openTag = true;
      newLine += line + '\n';
      return;
    }

    newLine += line;
    re.lastIndex = 0;
    const matches = newLine.matchAll(re);

    for (const match of matches) {
      var newTag = match[0];
      const start = match.index;
      const end = newTag.length;

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
    fs.writeFile('./' + process.argv[2], newFile, () => {});
  });
};
