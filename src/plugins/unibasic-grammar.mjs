// @ts-check

/**
 * TextMate grammar definition for UniBasic to enable syntax highlighting in Shiki.
 */
export const unibasicGrammar = {
  name: 'unibasic',
  aliases: ['basic'],
  scopeName: 'source.unibasic',
  displayName: 'UniBasic',
  patterns: [
    {
      name: 'comment.line.unibasic',
      match: '(;\\*|\\*|;|!|REM\\b).*$'
    },
    {
      name: 'string.quoted.double.unibasic',
      begin: '"',
      end: '"'
    },
    {
      name: 'string.quoted.single.unibasic',
      begin: "'",
      end: "'"
    },
    {
      name: 'string.quoted.backslash.unibasic',
      begin: '\\\\',
      end: '\\\\'
    },
    {
      name: 'variable.language.system.unibasic',
      match: '@[A-Za-z0-9_]+'
    },
    {
      name: 'keyword.control.unibasic',
      match: '\\b(?i:IF|THEN|ELSE|END|BEGIN|CASE|FOR|TO|STEP|NEXT|LOOP|WHILE|UNTIL|REPEAT|DO|EXIT|CONTINUE|GOTO|GO\\s+TO|GOSUB|ON|RETURN|STOP|ABORT)\\b'
    },
    {
      name: 'keyword.declaration.unibasic',
      match: '\\b(?i:SUBROUTINE|FUNCTION|CALL|EQUATE|EQU|COMMON|COM|DIM|DIMENSION|MAT)\\b'
    },
    {
      name: 'support.function.unibasic',
      match: '\\b(?i:PRINT|CRT|DISPLAY|INPUT|OPEN|CLOSE|READ|READU|READV|READVU|MATREAD|MATREADU|WRITE|WRITEU|WRITEV|WRITEVU|MATWRITE|MATWRITEU|DELETE|DELETEU|LOCATE|FIND|FINDSTR|INS|DEL|SELECT|READNEXT|EXECUTE|CONVERT|TRIM|FIELD|COUNT|DCOUNT|LEN|CHANGE)\\b'
    },
    {
      name: 'keyword.operator.logical.unibasic',
      match: '\\b(?i:AND|OR|NOT|MATCHES|MATCH|CAT)\\b'
    },
    {
      name: 'constant.numeric.unibasic',
      match: '\\b\\d+(\\.\\d+)?\\b'
    },
    {
      name: 'entity.name.label.unibasic',
      match: '^[A-Za-z0-9_.]+(?=:)'
    }
  ]
};
