/*
 * Codeshire: The Six Shards — story data.
 *
 * Every chapter is one of the six challenge types ("modules"). Edit the words freely:
 * each dialogue line is [speaker, text]. Speakers are keys of `cast`.
 * Enemy kinds and biomes are drawn by assets/js/app.js.
 */
window.CODESHIRE_STORY = {
  title: 'The Six Shards',

  cast: {
    hero:     { name: 'You',                       color: '#B8F35A' },
    tom:      { name: 'Farmer Tom',                color: '#F2C94C' },
    elara:    { name: 'Elara the Ranger',          color: '#7cd67a' },
    merlo:    { name: 'Merlo the Compiler Mage',   color: '#7cc7f7' },
    pip:      { name: 'Pip the Ferry Kid',         color: '#9fe3ff' },
    branch:   { name: 'Sir Branchwell',            color: '#c7d2ff' },
    brakka:   { name: 'Brakka Forgebeard',         color: '#ffb27a' },
    vessa:    { name: 'Vessa the Stackwalker',     color: '#f59ad0' },
    grukk:    { name: 'Grukk the Riddle-Warlord',  color: '#ff8a3d' },
    ogg:      { name: 'Ogg the Off-by-One Ogre',   color: '#ff8a3d' },
    glob:     { name: 'Queen Glob of the Shallows',color: '#ff8a3d' },
    rebasius: { name: 'Rebasius the Necromancer',  color: '#ff8a3d' },
    cascade:  { name: 'Cascade, the Forge Horror', color: '#ff8a3d' },
    nullk:    { name: 'Null, Demon of the Stack',  color: '#ff5a5a' },
  },

  prologue: [
    ['tom',  'You held the dock all year. The farm owes you a basket of strawberries... and, I fear, one more favour.'],
    ['tom',  'Last night the sky cracked. The Source Crystal that keeps Codeshire\'s code running split into six shards.'],
    ['tom',  'A demon called Null stole them and gave one to each of his generals. Since then, everything has started to break.'],
    ['hero', 'Then I\'ll bring the shards back. Where do I start?'],
    ['tom',  'The Whispering Woods, just past the east field. Find Elara the ranger. And remember: your blade only swings when your code is right.'],
  ],

  epilogue: [
    ['tom',    'Six shards, back where they belong. Look at that: the crystal is glowing again!'],
    ['elara',  'The woods have stopped whispering riddles. Now they only gossip.'],
    ['merlo',  'The catacomb scripts compile on the first try. It\'s eerie. I love it.'],
    ['branch', 'Main and Feature have signed a peace treaty. Merged cleanly, no conflicts.'],
    ['brakka', 'The forge is green across the board. I\'m taking a holiday!'],
    ['vessa',  'The Stack is quiet. Null won\'t be dereferenced again for a long, long time.'],
    ['hero',   'Then I\'ll take that basket of strawberries now, Tom.'],
  ],

  chapters: [
    {
      id: 'woods', type: 'output', num: 1,
      title: 'The Whispering Woods', region: 'Ch.1 · Woods',
      blurb: 'Ancient trees speak only in code. Predict what each spell prints before it is cast.',
      biome: 'woods', ally: 'elara', boss: 'grukk', shard: 'Emerald Shard',
      stages: [
        { name: 'Forest Edge',     foes: ['orc', 'orc', 'goblin'],
          say: [['elara', 'Orcs at the treeline. Their war-chants are code snippets. Say what they print and they lose their nerve.']] },
        { name: 'Mushroom Hollow', foes: ['goblin', 'orc', 'orc', 'orc_shaman'],
          say: [['elara', 'Careful, mushroom spores make the snippets trickier. Watch for floor division and sneaky types.']] },
        { name: 'Oracle Grove',    foes: ['orc', 'orc_shaman', 'masked_orc', 'orc'],
          say: [['hero', 'The trees are getting louder.'], ['elara', 'We\'re close to the Oracle Tree. Grukk is camping beneath it.']] },
      ],
      intro: [
        ['elara', 'You must be Tom\'s soldier. I\'m Elara. I\'ve tracked the orcs for three days.'],
        ['elara', 'Their warlord, Grukk, hung the Emerald Shard from the Oracle Tree. Now every tree only speaks in riddles of code.'],
        ['hero',  'Riddles I can handle. Lead the way.'],
      ],
      preBoss: [
        ['grukk', 'HRRAH! A tiny soldier! Tell me what my riddles print, or the shard stays mine!'],
        ['elara', 'He needs three correct answers to fall. Don\'t rush it.'],
      ],
      outro: [
        ['elara', 'The Emerald Shard! Listen... the trees have gone quiet.'],
        ['elara', 'There\'s an old crypt to the north. Wizards used to keep their scrolls there. I heard something big is down there now.'],
        ['hero',  'Then that\'s where we go next.'],
      ],
    },
    {
      id: 'crypt', type: 'bug', num: 2,
      title: 'The Bugged Catacombs', region: 'Ch.2 · Catacombs',
      blurb: 'Every wall is built from broken scripts. Find the exact line that crumbles.',
      biome: 'crypt', ally: 'merlo', boss: 'ogg', shard: 'Sapphire Shard',
      stages: [
        { name: 'Collapsed Stairway', foes: ['skelet', 'goblin', 'skelet'],
          say: [['merlo', 'Mind the spikes. The skeletons rattle louder when there\'s a bug nearby.']] },
        { name: 'Hall of Banners',    foes: ['tiny_zombie', 'skelet', 'imp', 'skelet'],
          say: [['merlo', 'These banners were written in C. Off-by-one errors everywhere. Count your array bounds!']] },
        { name: 'Fountain Vault',     foes: ['imp', 'zombie', 'skelet', 'masked_orc'],
          say: [['merlo', 'The vault fountain only flows when the code is clean. Keep fixing, soldier.']] },
      ],
      intro: [
        ['merlo', 'Ah! A visitor! Please tell me you can read code. I\'ve been trapped down here for a week.'],
        ['merlo', 'I\'m Merlo, Compiler Mage. An ogre named Ogg took the Sapphire Shard and filled the catacombs with bugs.'],
        ['merlo', 'Every monster carries a cursed script. Click the broken line and the curse breaks.'],
        ['hero',  'Stay behind me, Merlo.'],
      ],
      preBoss: [
        ['ogg',   'OGG COUNT TO TEN! ONE, TWO, ... ELEVEN! OGG ALWAYS COUNT ONE TOO MANY!'],
        ['merlo', 'That\'s him. His bugs are the worst kind: they almost work.'],
      ],
      outro: [
        ['merlo', 'The Sapphire Shard! And look, the fountain is running clear again.'],
        ['merlo', 'The river villages to the south have sent word. The water is full of slimes that copy every pattern they see.'],
        ['merlo', 'Find a boy named Pip at the ferry. He knows the shallows.'],
      ],
    },
    {
      id: 'river', type: 'regex', num: 3,
      title: 'Slimewater Crossing', region: 'Ch.3 · River',
      blurb: 'Rune bridges open only to the right pattern. Write regexes to defuse the slime traps.',
      biome: 'river', ally: 'pip', boss: 'glob', shard: 'Aquamarine Shard',
      stages: [
        { name: 'Ferry Landing',  foes: ['slime', 'slime', 'slime'],
          say: [['pip', 'Each slime is a rune-bomb! Match the safe wires, skip the traps, and it pops harmlessly.']] },
        { name: 'Lily Shallows',  foes: ['slime', 'swampy', 'slime', 'slime'],
          say: [['pip', 'The swampy ones are slippery. Anchor your patterns with ^ and $ or they\'ll match too much!']] },
        { name: 'Rune Bridge',    foes: ['slime', 'muddy', 'slime', 'swampy'],
          say: [['hero', 'The bridge runes are glowing.'], ['pip', 'That means Queen Glob is near. She\'s HUGE.']] },
      ],
      intro: [
        ['pip',  'Are you the soldier Merlo told me about? I\'m Pip! I run the ferry, well, I used to.'],
        ['pip',  'Queen Glob swallowed the Aquamarine Shard. Now her slimes guard every bridge with rune-locks.'],
        ['pip',  'Write a pattern that matches the safe wires and none of the traps. Then BOOM, the trap is defused!'],
        ['hero', 'Patterns. Got it.'],
      ],
      preBoss: [
        ['glob', 'Blorp. You matched my children. But can you match ME? I accept everything... except what I don\'t.'],
        ['pip',  'Three runes to break her. Anchor everything!'],
      ],
      outro: [
        ['pip',  'You popped the Queen! The Aquamarine Shard, it\'s so shiny!'],
        ['pip',  'Across the river is the Forked Kingdom. Two lords split it in half, and a necromancer keeps the war going.'],
        ['pip',  'Sir Branchwell guards the border. Tell him Pip sent you!'],
      ],
    },
    {
      id: 'fork', type: 'merge', num: 4,
      title: 'The Forked Kingdom', region: 'Ch.4 · Kingdom',
      blurb: 'Two branches of one kingdom collide. Resolve each conflict to march the skeletons out.',
      biome: 'fork', ally: 'branch', boss: 'rebasius', shard: 'Amethyst Shard',
      stages: [
        { name: 'Border Village',  foes: ['skeleton', 'skeleton', 'skelet'],
          say: [['branch', 'Each skeleton carries two versions of the same scroll. Decide which to keep, or how to combine them.']] },
        { name: 'Split Graveyard', foes: ['skeleton', 'skelet', 'skeleton', 'skeleton'],
          say: [['branch', 'Sometimes both sides are right. Read the commit messages: they tell you what each side wanted.']] },
        { name: 'Merge Gate',      foes: ['skeleton', 'necro_minion', 'skeleton', 'skeleton'],
          say: [['hero', 'Is that a gate made of commit history?'], ['branch', 'Rebasius rewrote it. Twice. Let\'s end this.']] },
      ],
      intro: [
        ['branch', 'Halt! Ah, Pip sent you. Welcome to what\'s left of the Forked Kingdom.'],
        ['branch', 'Lord Main and Lady Feature edited the royal scrolls at the same time. Now every scroll has a conflict.'],
        ['branch', 'Rebasius the Necromancer feeds on the confusion. He raises a skeleton for every unresolved conflict.'],
        ['hero',   'So we resolve them all. Show me the way.'],
      ],
      preBoss: [
        ['rebasius', 'Fool. I have rewritten history itself. Force-pushed it. Nobody remembers what main used to say!'],
        ['branch',   'We remember. Resolve his conflicts and he crumbles!'],
      ],
      outro: [
        ['branch', 'The Amethyst Shard. Main and Feature are shaking hands at last.'],
        ['branch', 'But look east. The Forge mountain is on fire. The dwarves\' servers have been down for days.'],
        ['branch', 'Ask for Brakka Forgebeard. She hates being woken up at night, so be quick.'],
      ],
    },
    {
      id: 'forge', type: 'prod', num: 5,
      title: 'Mount Prod', region: 'Ch.5 · Forge',
      blurb: 'The dwarven forge is down. Read the logs, find the cause, run the one command that fixes it.',
      biome: 'forge', ally: 'brakka', boss: 'cascade', shard: 'Ruby Shard',
      stages: [
        { name: 'Ash Gate',        foes: ['blood', 'imp', 'blood'],
          say: [['brakka', 'Every one of those horrors is a live incident. Read the logs first, then act. Never guess.']] },
        { name: 'Lava Server Hall', foes: ['imp', 'blood', 'chort', 'blood'],
          say: [['brakka', 'And never run "rm -rf" on my forge, or I\'ll run it on you.']] },
        { name: 'Core Furnace',    foes: ['chort', 'blood', 'blood', 'chort'],
          say: [['hero', 'The heat is unbearable.'], ['brakka', 'That\'s Cascade. Every failure it causes triggers another one.']] },
      ],
      intro: [
        ['brakka', 'Who\'s there?! Oh. A soldier. Good: I need hands, not more alerts.'],
        ['brakka', 'I\'m Brakka Forgebeard. Cascade, a forge horror, stole the Ruby Shard and set fire to production.'],
        ['brakka', 'Every monster is a SEV-1. Read the logs, find the root cause, run exactly one fix.'],
        ['hero',   'Root cause, then one command. On it.'],
      ],
      preBoss: [
        ['cascade', 'ONE FAILURE FEEDS THE NEXT! RETRY! RETRY! RETRY!'],
        ['brakka',  'It\'s a retry storm with legs. Fix three root causes and it collapses.'],
      ],
      outro: [
        ['brakka', 'All green. The Ruby Shard is cooling in the quench tank.'],
        ['brakka', 'The last shard is with Null himself, at the bottom of the Abyssal Stack.'],
        ['brakka', 'Find Vessa the Stackwalker at the rim. She\'s the only one who has gone down and come back.'],
      ],
    },
    {
      id: 'abyss', type: 'dive', num: 6,
      title: 'The Abyssal Stack', region: 'Ch.6 · Abyss',
      blurb: 'Dive layer by layer: git, HTTP, Linux and more. The rarer your answer, the harder you hit.',
      biome: 'abyss', ally: 'vessa', boss: 'nullk', shard: 'Obsidian Shard',
      stages: [
        { name: 'Application Layer', foes: ['demon', 'imp', 'demon'],
          say: [['vessa', 'Down here, knowledge is a weapon. Common answers scratch. Legendary answers wound.']] },
        { name: 'Kernel Depths',     foes: ['chort', 'demon', 'imp', 'demon'],
          say: [['vessa', 'Each layer is deeper than the last. Name what you know, and name the rare things if you can.']] },
        { name: 'Bare Metal',        foes: ['demon', 'big_demon_minion', 'demon', 'chort'],
          say: [['hero', 'I can hear something breathing.'], ['vessa', 'That is Null. He has been waiting for you since the first shard.']] },
      ],
      intro: [
        ['vessa', 'So you\'re the one collecting shards. I am Vessa. I walk the Stack, every layer from apps down to bare metal.'],
        ['vessa', 'Null lives at the bottom. He holds the Obsidian Shard, the heart of the Source Crystal.'],
        ['vessa', 'Demons here test what you know. Name commands, status codes, flags. The rarer the answer, the harder you strike.'],
        ['hero',  'Then let\'s dive.'],
      ],
      preBoss: [
        ['nullk', 'Little soldier. You collected five shards. Five! And yet everything you hold can still point to... nothing.'],
        ['vessa', 'Four strikes to finish him. Use everything you\'ve learned!'],
        ['hero',  'Not today, Null.'],
      ],
      outro: [
        ['vessa', 'Null is gone. The Obsidian Shard is yours, and the Source Crystal is whole again.'],
        ['vessa', 'Go home, soldier. Codeshire is safe.'],
      ],
    },
  ],
};
