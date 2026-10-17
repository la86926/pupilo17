"""Extrae los capítulos 33-42 del estudio «Caro Kann al estilo Pupilochess».

Cada ramificación se convierte en una línea completa que empieza en la posición
inicial. Se conservan todos los comentarios del maestro, los símbolos (NAG),
las flechas [%cal] y las casillas [%csl]. Se quitan solo [%eval], [%clk] y [%mdl],
que son datos técnicos del motor y del reloj, no comentarios.
"""
import json, re, sys
import chess, chess.pgn

ESTUDIO = sys.argv[1]   # pgn/estudio-33-42.pgn: los capítulos en orden
SALIDA = sys.argv[2]    # lecciones-data.js
PRIMERO = 33            # número del primer capítulo del archivo

NAG = {1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!', 7: '□', 10: '=', 13: '∞',
       14: '⩲', 15: '⩱', 16: '±', 17: '∓', 18: '+−', 19: '−+', 22: '⨀', 32: '⟳', 36: '→',
       40: '↑', 44: '=/∞', 132: '⇆', 146: 'N'}
PIEZA = {'K': 'R', 'Q': 'D', 'R': 'T', 'B': 'A', 'N': 'C'}

TAG = re.compile(r'\[%(\w+)\s+([^\]]*)\]')


def san_es(san):
    if san[0] in PIEZA:
        san = PIEZA[san[0]] + san[1:]
    return re.sub(r'=([QRBN])', lambda m: '=' + PIEZA[m.group(1)], san)


def limpiar(texto):
    """Devuelve (texto sin etiquetas técnicas, flechas, casillas)."""
    flechas, casillas = [], []
    for tipo, val in TAG.findall(texto or ''):
        if tipo == 'cal':
            flechas += [v.strip() for v in val.split(',') if v.strip()]
        elif tipo == 'csl':
            casillas += [v.strip() for v in val.split(',') if v.strip()]
    t = TAG.sub('', texto or '')
    # espacios sobrantes que dejan las etiquetas, sin tocar los saltos de línea
    t = '\n'.join(re.sub(r'[ \t]+', ' ', l).strip() for l in t.split('\n'))
    t = re.sub(r'\n{3,}', '\n\n', t).strip()
    return t, flechas, casillas


def nombre_jugada(nodo):
    b = nodo.parent.board()
    num = b.fullmove_number
    pref = f'{num}.' if b.turn == chess.WHITE else f'{num}...'
    marcas = ''.join(NAG[n] for n in sorted(nodo.nags) if n in (1, 2, 3, 4, 5, 6))
    return pref + san_es(b.san(nodo.move)) + marcas


def capitulo(juego, numero):
    plies = []          # tabla de jugadas compartida por las líneas
    indice = {}         # id(nodo) -> posición en plies

    def ply(nodo):
        k = id(nodo)
        if k in indice:
            return indice[k]
        b = nodo.parent.board()
        com, fl, cs = limpiar(nodo.comment)
        pre, fl2, cs2 = limpiar(nodo.starting_comment)
        nags = sorted(nodo.nags)
        dentro = ''.join(NAG[n] for n in nags if n in (1, 2, 3, 4, 5, 6))
        fuera = ' '.join(NAG.get(n, '$%d' % n) for n in nags if n not in (1, 2, 3, 4, 5, 6))
        plies.append({
            's': san_es(b.san(nodo.move)) + dentro,
            'en': b.san(nodo.move) + dentro,
            'm': ('%d.' if b.turn == chess.WHITE else '%d...') % b.fullmove_number,
            'e': fuera,
            'u': nodo.move.uci(),
            'c': com,
            'p': pre,
            'a': fl,
            'q': cs,
            'pa': fl2,
            'pq': cs2,
        })
        indice[k] = len(plies) - 1
        return indice[k]

    lineas = []

    def recorrer(prefijo, primero, etiqueta, padre):
        ids = list(prefijo)
        ramas = []
        n = primero
        while n is not None:
            ids.append(ply(n))
            p = n.parent
            if p.variations[0] is n:
                for alt in p.variations[1:]:
                    ramas.append((list(ids[:-1]), alt))
            n = n.variations[0] if n.variations else None
        mi = len(lineas)
        lineas.append({'nm': etiqueta, 'ids': ids, 'br': len(prefijo), 'pd': padre})
        for pre, alt in ramas:
            nueva = (etiqueta + ' › ' if etiqueta else '') + nombre_jugada(alt)
            recorrer(pre, alt, nueva, mi)

    recorrer([], juego.variations[0], '', None)

    intro, fl, cs = limpiar(juego.comment)
    h = juego.headers
    return {
        'n': numero,
        'titulo': h.get('ChapterName', '').replace('  ', ' ').strip(),
        'blancas': h.get('White', ''),
        'negras': h.get('Black', ''),
        'evento': h.get('Event', ''),
        'sitio': h.get('Site', ''),
        'fecha': h.get('Date', ''),
        'resultado': h.get('Result', '*'),
        'eco': h.get('ECO', ''),
        'apertura': h.get('Opening', ''),
        'url': h.get('ChapterURL', ''),
        'intro': intro,
        'introA': fl,
        'introQ': cs,
        'plies': plies,
        'lineas': lineas,
    }


def main():
    caps = []
    with open(ESTUDIO, encoding='utf-8') as f:
        i = 0
        while True:
            g = chess.pgn.read_game(f)
            if g is None:
                break
            numero = PRIMERO + i
            i += 1
            if g.errors:
                raise SystemExit(f'Errores en el capítulo {numero}: {g.errors}')
            caps.append(capitulo(g, numero))
    with open(SALIDA, 'w', encoding='utf-8') as f:
        f.write('/* Lecciones 33-42 del estudio «Caro Kann al estilo Pupilochess».\n'
                '   Generado por tools/extraer.py a partir de pgn/estudio-33-42.pgn. No editar a mano. */\n')
        f.write('window.P17_CAPS=')
        json.dump(caps, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    for c in caps:
        print(c['n'], len(c['lineas']), 'líneas', len(c['plies']), 'jugadas', '-', c['titulo'])


main()
