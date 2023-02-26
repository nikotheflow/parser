class Pattern {
  constructor(exec) {
    this.exec = exec;

    this.then = function (transform) {
      return new Pattern(function (str, pos) {
        const r = exec(str, pos);
        return r && { res: transform(r.res), end: r.end };
      });
    };

    this.exec = function (str, pos) {
      const r = exec(str, pos || 0);
      return pos >= 0 ? r : !r ? null : r.end != str.length ? null : r.res;
    };
  }
}


// Patterns
function digit() {
  return new Pattern(function (str, pos) {
    const chr = str.charAt(pos);
      if (chr >= 0 && chr <= 9) 
        return { res: +chr, end: pos + 1};
  });
};

function txt(text) {
  return new Pattern(function (str, pos) {
    if (str.substr(pos, text.length) == text)
      return { res: text, end: pos + text.length };
  });
}

function rgx(regexp) {
  return new Pattern(function (str, pos) {
    const m = regexp.exec(str.slice(pos));
    if (m && m.index === 0)
        return { res: m[0], end: pos + m[0].length };
  });
}


// Combinators
function opt(pattern) {
  return new Pattern(function (str, pos) {
    return pattern.exec(str, pos) || { res: void 0, end: pos };
  });
}

function exc(pattern, except) {
  return new Pattern(function (str, pos) {
    return !except.exec(str, pos) && pattern.exec(str, pos);
  });
}

function any(...patterns) {
  return new Pattern(function (str, pos) {
    for (let r, i = 0; i < patterns.length; i++) {
      if (r = patterns[i].exec(str, pos)) {
        return r;
      }
    }
  });
}

function seq(...patterns) {
  return new Pattern(function (str, pos) {
    let i, r, end = pos, res = [];

    for (i = 0; i < patterns.length; i++) {
      r = patterns[i].exec(str, end);
      if (!r) return;
      res.push(r.res);
      end = r.end;
    }

    return { res: res, end: end };
  });
}

function rep(pattern, separator) {
  let separated = !separator ? pattern :
    seq(separator, pattern).then(r => r[1]);

  return new Pattern(function (str, pos) {
    let res = [], end = pos, r = pattern.exec(str, end);

    while (r && r.end > end) {
      res.push(r.res);
      end = r.end;
      r = separated.exec(str, end);
    }

    return { res: res, end: end };
  });
}


// Parsing
const prop = rgx(/[a-z-]+/i).then(s => s.toLowerCase());
const char = rgx(/[^:;&]/i);
const operator = txt(':');
const value = seq(rep(char)).then(r => r[0].join(''));
const typedValue = any(digit(), value);
const separator = txt(";");

const phrase = seq(prop, operator, typedValue, separator).then(r => ({ property: r[0], value: r[2], operator: r[1] }));

const str = rep(phrase);
const css = 'padding:0;z-index:3;overflow:hidden;';

console.log(str.exec(css));

