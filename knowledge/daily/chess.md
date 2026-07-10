# Chess: Strategy & Tactics

## Board & Notation
- **Algebraic notation**: a1-h8, ranks 1-8. K=king, Q=queen, R=rook, B=bishop, N=knight, P=pawn. Castling: O-O (kingside), O-O-O (queenside). Capture: x. Check: +. Checkmate: #. e4 = pawn to e4. Nf3 = knight to f3. Bxe5 = bishop captures on e5. Exclamation = good move (!). Question = bad move (?). !? = interesting (possibly good). ?! = dubious. 0-0 = castle kingside. 0-0-0 = castle queenside. e.p.= en passant (= pawn captures pawn moving two squares as if it moved one)
- **Board coordinates**: a1 (lower left for white, dark square). Queen on her color (white queen = d1/light, black queen = d8/dark)
- **Notating a game**: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. Re1 O-O... Piece + destination square. If ambiguity: Nbd2 (knight on b-file goes to d2), N1d2? Actually Nbd2: the b-knight to d2. Or R1e1, R5e1? Actually indicate file or rank to distinguish

## Opening Principles
- **Control center**: pawns to d4/e4. Develop knights before bishops. Castle early (king safety, rook activation). Don't move same piece twice in opening. Don't bring queen out early (she becomes target). Connect rooks (clear back rank)
  - "Knights before bishops" (knights more restricted at start, bishops have many natural options). Develop with threat when possible
- **Common openings**: Italian (1. e4 e5 2. Nf3 Nc6 3. Bc4 — classical, good for all levels). Spanish/Ruy Lopez (1. e4 e5 2. Nf3 Nc6 3. Bb5 — oldest + most studied). Sicilian (1. e4 c5 — asymmetrical, complex, sharp). French (1. e4 e6 — solid, counterattack in center, closed). Caro-Kann (1. e4 c6 — solid, Caro vs French: c6 strikes at d5 instead of e6, gives c8 bishop out). Queen's Gambit (1. d4 d5 2. c4 — white trades tempo for center, black accepted/ declined). King's Indian Defense (1. d4 Nf6 2. c4 g6 — hypermodern, fianchetto bishop, counterattack)
- **Basic opening goals**: control center, king safety (castle), development (minor pieces, then rooks), create weaknesses in opponent's position

## Tactics
- **Fork**: one piece attacks two+ enemy pieces. Knight forks most common (N attacks up to 8 squares, can attack unguarded pieces). Also: pawn fork, queen fork, bishop fork. Look for: square where piece attacks multiple unprotected enemy pieces. Creating fork: sometimes sacrifice to force opponent into fork formation
- **Pin**: piece can't move (or can't move without exposing more valuable piece behind it). Absolute pin: bishop pins knight to king (knight can't move — illegal). Relative pin: bishop pins knight to queen (moving knight loses queen, but legal). Use pins to attack, immobilize defending pieces
- **Skewer**: valuable piece attacked, moves, less valuable piece behind captured. Rook on a-file attacks king on a1, queen on a2. King moves, queen captured. Opposite of pin: high-value piece in front
- **Discovered attack**: piece moves, reveals attack from behind (often bishop/rook/queen). Discovered check: moving piece exposes check from rear piece. Very powerful (moving piece can attack + discovered attack!). Double check: both moving piece + revealed piece give check (king MUST move — only other piece can block two pieces, impossible, so king must move)
- **Remove the defender**: capture a piece that's defending another piece (king, queen, critical square). Example: bishop defends knight. Capture bishop, now knight undefended, capture next move
- **Back rank mate**: king trapped behind own pawns, rook/queen gives checkmate on back rank. Prevent: move one of three pawns (create escape square). Castle early. "Back rank weakness"
- **Zwischenzug (in-between move)**: unexpected move inserted before expected recapture/ sequence. "In-between" move that changes the equation before opponent expects. Always ask: "Is there a check or threat before I recapture?"
- **Zugzwang**: forced to move (any move worsens position). Usually in endgame. "I pass?" — not allowed. King position or blocked pawn structure = zugzwang situations. In endgame, controlling the opposition (king blocks opponent's advance)

## Strategy
- **Material**: piece values: pawn=1, knight=3, bishop=3, rook=5, queen=9. Bishop pair advantage (two bishops vs bishop+knight or two knights). Knight better in closed positions (can jump, not blocked). Bishop better in open positions (long diagonals)
  - Trade pieces when ahead in material (simplifies to winning endgame). Trade when behind? No — keep pieces active, create complications
- **Pawn structure**: isolated pawn (no neighboring pawns, weak). Doubled pawns (weak, can't defend each other). Backward pawn (can't advance easily — weak square in front). Passed pawn (no enemy pawns blocking — powerful, must be blockaded). Pawn chain (diagonal line, attack base of chain). Pawn islands: fewer islands = better (compact)
  - "Pawns are the soul of chess" — Philidor. Understand pawn structure before planning strategy
- **King safety**: castle early (usually O-O). Keep pawns in front of king (no gaps). Watch for sacrifices to open king position. In endgame: king becomes a strong piece (active king). Center the king in endgame
- **Space advantage**: controlling more squares = easier to maneuver + limit opponent's pieces. Avoid unnecessary pawn advances that create weaknesses
- **Outpost**: square protected by own pawn, can't be attacked by enemy pawn. Key square for knight (stability). Good piece placement = better position. Central outposts best
- **Blockade**: place piece in front of passed pawn to stop advance. Knight best for blockade (controls many squares). Rook behind passed pawn supports it from behind

## Endgame Principles
- **Opposition**: kings face each other with odd number of squares between. Whoever moves first loses opposition. Critical for king + pawn endgames. Distant opposition: kings on same file with 1-5 squares between — if odd number, opposition to the player NOT to move
- **Square of the pawn**: visualize square diagonal from pawn to promotion rank. If opposing king can enter square, it catches pawn. If not, pawn promotes. King's path must be within square before pawn promotes
- **Lucena position**: rook + pawn vs rook. Key: pawn on 7th rank, king in front of pawn, rook on 8th rank cuts off enemy king. Build a "bridge" (rook moves to 4th rank, king escapes check, pawn promotes)
- **Philidor position**: rook + pawn vs rook (draw if defender knows technique). Defending king in front of pawn, rook attacks from 3rd rank or distant side, cutting off enemy king
- **Basic checkmates**: K+Q vs K (easy — box king). K+R vs K (rooftop method drive to edge). K+BB vs K (possible — 50 moves rule, tricky). K+BN vs K (very hard, must force king to corner of same color as bishop). K+2N vs K is a draw (can't force mate unless opponent blunders). K+knight+bishop is the hardest common mate — force king to corner same color as bishop, use "W" maneuver
- **50-move rule**: 50 moves without capture or pawn move = draw. Extended for some endgames? Recently reduced from 100 to 75? Actually 50-move rule unchanged; in 2014, FIDE extended to 75 for certain endgames? Actually FIDE extended to 50+ moves for specific theoretically winning endings but with 2014 change: a game is drawn if 75 consecutive moves without capture or pawn move (no request needed)

## Classic Games & Players
- **Garry Kasparov**: world #1 for 20+ years. 1985-2000 (defeated Karpov 1985, remained world champion until 2000). Deep Blue match 1997: lost to IBM computer (landmark, first time computer beat world champion in match). Known for: aggressive, deep preparation, tactical brilliance
- **Bobby Fischer**: US champion at 14. 1972 world champion, beat Spassky (Cold War match). Known for: e4 opening, deep positional play, demand for perfect conditions. Retired 1975, never defended title. Fischer random (chess960): he invented variant, random starting position, reduces opening theory. Highest ELO rating of his time (2785)
- **Magnus Carlsen**: world #1 2011-present (current champion before 2023 — stepped down, Ding Liren world champion 2023-2024). 5-time world champion (2013-2021). Known for: endgame technique, persistence, squeezing wins from equal positions — "simple human blunders under pressure." Highest ELO 2882 (all-time record). But also all-time world champion in rapid + blitz
- **Mikhail Tal**: "Magician from Riga." Sacrificial, attacking style. World champion 1960-1961 (at 23). Known for: insane complications, sacrifices, psychological pressure. "Tal sacrificed a pawn on move 8; he didn't know why, he just did it — his opponents went into shock."
- **Anand**: calm, fast, versatile. World champion 2000-2002, 2007-2013. Multiple formats
