// Tirage au sort façon « Père Noël secret ».
// Chaque membre offre à exactement une personne et reçoit d'exactement une
// personne, jamais à lui-même ni à quelqu'un d'exclu (ex. son conjoint).

function isExcluded(exclusions, a, b) {
  return exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function shuffle(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Retourne {giverId: receiverId} ou null si aucune combinaison n'est possible.
export function drawPairs(memberIds, exclusions = [], random = Math.random) {
  if (memberIds.length < 2) return null;
  const givers = shuffle(memberIds, random);
  const pairs = {};
  const taken = new Set();

  // Retour sur trace : petit nombre de membres, donc toujours rapide.
  function assign(index) {
    if (index === givers.length) return true;
    const giver = givers[index];
    for (const receiver of shuffle(memberIds, random)) {
      if (receiver === giver || taken.has(receiver) || isExcluded(exclusions, giver, receiver)) continue;
      pairs[giver] = receiver;
      taken.add(receiver);
      if (assign(index + 1)) return true;
      taken.delete(receiver);
      delete pairs[giver];
    }
    return false;
  }

  return assign(0) ? pairs : null;
}
